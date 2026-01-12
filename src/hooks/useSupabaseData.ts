import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Team, Member, MAX_MEMBERS, SubscriptionType } from '@/types/member';

interface DbTeam {
  id: string;
  user_id: string;
  team_name: string;
  admin_email: string;
  logo: string | null;
  created_at: string;
  last_backup: string | null;
  is_yearly: boolean | null;
}

interface DbMember {
  id: string;
  team_id: string;
  user_id: string;
  email: string;
  phone: string;
  telegram: string | null;
  two_fa: string | null;
  twofa: string | null;
  password: string | null;
  join_date: string;
  is_paid: boolean;
  paid_amount: number | null;
  pending_amount: number | null;
  subscriptions: string[] | null;
  created_at: string;
}

const mapDbTeamToTeam = (dbTeam: DbTeam, members: Member[]): Team => ({
  id: dbTeam.id,
  teamName: dbTeam.team_name,
  adminEmail: dbTeam.admin_email,
  members,
  createdAt: dbTeam.created_at,
  lastBackup: dbTeam.last_backup || undefined,
  logo: dbTeam.logo as SubscriptionType | undefined,
  isYearlyTeam: dbTeam.is_yearly || false,
});

const mapDbMemberToMember = (dbMember: DbMember): Member => ({
  id: dbMember.id,
  email: dbMember.email,
  phone: dbMember.phone,
  telegram: dbMember.telegram || undefined,
  twoFA: dbMember.twofa || dbMember.two_fa || undefined,
  password: dbMember.password || undefined,
  joinDate: dbMember.join_date,
  isPaid: dbMember.is_paid,
  paidAmount: dbMember.paid_amount || undefined,
  pendingAmount: dbMember.pending_amount || undefined,
  subscriptions: (dbMember.subscriptions as SubscriptionType[]) || undefined,
});

export function useSupabaseData() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch all teams and members
  const fetchData = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setActiveTeamId(null);
      setIsLoaded(true);
      return;
    }

    const { data: dbTeams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      setIsLoaded(true);
      return;
    }

    const { data: dbMembers, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', user.id);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      setIsLoaded(true);
      return;
    }

    const membersByTeam: Record<string, Member[]> = {};
    (dbMembers || []).forEach((dbMember: DbMember) => {
      if (!membersByTeam[dbMember.team_id]) {
        membersByTeam[dbMember.team_id] = [];
      }
      membersByTeam[dbMember.team_id].push(mapDbMemberToMember(dbMember));
    });

    const mappedTeams = (dbTeams || []).map((dbTeam: DbTeam) =>
      mapDbTeamToTeam(dbTeam, membersByTeam[dbTeam.id] || [])
    );

    setTeams(mappedTeams);
    
    if (mappedTeams.length > 0 && !activeTeamId) {
      setActiveTeamId(mappedTeams[0].id);
    }
    
    setIsLoaded(true);
  }, [user, activeTeamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeTeam = useMemo(() => {
    return teams.find((t) => t.id === activeTeamId) || teams[0] || null;
  }, [teams, activeTeamId]);

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

  const createNewTeam = useCallback(async (teamName?: string, logo?: SubscriptionType, isYearly?: boolean) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('teams')
      .insert({
        user_id: user.id,
        team_name: teamName || 'My Elite Team',
        admin_email: isYearly ? '' : (user.email || 'admin@example.com'),
        logo: logo || null,
        is_yearly: isYearly || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating team:', error);
      return null;
    }

    const newTeam = mapDbTeamToTeam(data, []);
    setTeams((prev) => [newTeam, ...prev]);
    setActiveTeamId(newTeam.id);
    return newTeam;
  }, [user]);

  const deleteTeam = useCallback(async (teamId: string) => {
    const { error } = await supabase.from('teams').delete().eq('id', teamId);

    if (error) {
      console.error('Error deleting team:', error);
      return;
    }

    setTeams((prev) => {
      const remaining = prev.filter((t) => t.id !== teamId);
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
      console.error('Error updating team name:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) => (t.id === activeTeamId ? { ...t, teamName: name } : t))
    );
  }, [activeTeamId]);

  const updateAdminEmail = useCallback(async (email: string) => {
    if (!activeTeamId) return;

    const { error } = await supabase
      .from('teams')
      .update({ admin_email: email })
      .eq('id', activeTeamId);

    if (error) {
      console.error('Error updating admin email:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) => (t.id === activeTeamId ? { ...t, adminEmail: email } : t))
    );
  }, [activeTeamId]);

  const updateTeamCreatedAt = useCallback(async (createdAt: string) => {
    if (!activeTeamId) return;

    const { error } = await supabase
      .from('teams')
      .update({ created_at: createdAt })
      .eq('id', activeTeamId);

    if (error) {
      console.error('Error updating team created at:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) => (t.id === activeTeamId ? { ...t, createdAt } : t))
    );
  }, [activeTeamId]);

  const updateTeamLogo = useCallback(async (teamId: string, logo: SubscriptionType) => {
    const { error } = await supabase
      .from('teams')
      .update({ logo })
      .eq('id', teamId);

    if (error) {
      console.error('Error updating team logo:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, logo } : t))
    );
  }, []);

  const addMember = useCallback(
    async (
      member: Omit<Member, 'id'>,
      targetTeamId?: string
    ): Promise<{ ok: boolean; error?: string; code?: string }> => {
      const teamIdToUse = targetTeamId || activeTeamId;
      if (!user || !teamIdToUse) return { ok: false, error: 'Not authenticated' };

      const team = teams.find((t) => t.id === teamIdToUse);
      if (!team) return { ok: false, error: 'Team not found' };

      // No limit for yearly teams
      if (!team.isYearlyTeam && team.members.length + 1 >= MAX_MEMBERS) {
        return { ok: false, error: `Maximum ${MAX_MEMBERS} members allowed` };
      }

      const baseInsert = {
        team_id: teamIdToUse,
        user_id: user.id,
        email: member.email,
        phone: member.phone || '',
        telegram: member.telegram || null,
        join_date: member.joinDate,
        is_paid: member.isPaid || false,
        paid_amount: member.paidAmount || null,
        subscriptions: member.subscriptions || null,
      };

      const buildPayload = (opts: { includePassword: boolean; includeTwoFA: boolean }) => {
        const payload: Record<string, unknown> = { ...baseInsert };
        if (opts.includeTwoFA) payload.twofa = member.twoFA || null;
        if (opts.includePassword) payload.password = member.password || null;
        return payload;
      };

      const tryInsert = (opts: { includePassword: boolean; includeTwoFA: boolean }) => {
        const payload = buildPayload(opts);
        return supabase.from('members').insert(payload).select().maybeSingle();
      };

      // Some projects don’t have optional columns like `password` or `two_fa` on `members`.
      // If PostgREST tells us a column doesn’t exist, retry without that column.
      let opts = { includePassword: true, includeTwoFA: true };
      let { data, error } = await tryInsert(opts);

      if (error?.code === 'PGRST204') {
        const msg = error.message || '';
        if (msg.includes("'two_fa'")) opts = { ...opts, includeTwoFA: false };
        if (msg.includes("'password'")) opts = { ...opts, includePassword: false };

        ({ data, error } = await tryInsert(opts));

        // If the error mentions the other optional column on retry, drop it too.
        if (error?.code === 'PGRST204') {
          const msg2 = error.message || '';
          if (msg2.includes("'two_fa'")) opts = { ...opts, includeTwoFA: false };
          if (msg2.includes("'password'")) opts = { ...opts, includePassword: false };
          ({ data, error } = await tryInsert(opts));
        }
      }

      if (error) {
        console.error('Error adding member:', error);
        return { ok: false, error: error.message, code: error.code };
      }

      // In some RLS setups, the insert can succeed but the returning row is not selectable.
      // In that case, refresh from DB to keep UI in sync.
      if (!data) {
        await fetchData();
        return { ok: true };
      }

      const newMember = mapDbMemberToMember(data);
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamIdToUse ? { ...t, members: [...t.members, newMember] } : t
        )
      );
      return { ok: true };
    },
    [user, activeTeamId, teams, fetchData]
  );

  const removeMember = useCallback(async (id: string) => {
    const { error } = await supabase.from('members').delete().eq('id', id);

    if (error) {
      console.error('Error removing member:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? { ...t, members: t.members.filter((m) => m.id !== id) }
          : t
      )
    );
  }, [activeTeamId]);

  const updateMemberDate = useCallback(async (id: string, joinDate: string) => {
    const { error } = await supabase
      .from('members')
      .update({ join_date: joinDate })
      .eq('id', id);

    if (error) {
      console.error('Error updating member date:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === id ? { ...m, joinDate } : m
              ),
            }
          : t
      )
    );
  }, [activeTeamId]);

  const updateMemberEmail = useCallback(async (id: string, email: string) => {
    const { error } = await supabase
      .from('members')
      .update({ email })
      .eq('id', id);

    if (error) {
      console.error('Error updating member email:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              members: t.members.map((m) => (m.id === id ? { ...m, email } : m)),
            }
          : t
      )
    );
  }, [activeTeamId]);

  const updateMemberPhone = useCallback(async (id: string, phone: string) => {
    const { error } = await supabase
      .from('members')
      .update({ phone })
      .eq('id', id);

    if (error) {
      console.error('Error updating member phone:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              members: t.members.map((m) => (m.id === id ? { ...m, phone } : m)),
            }
          : t
      )
    );
  }, [activeTeamId]);

  const updateMemberTelegram = useCallback(async (id: string, telegram: string) => {
    const { error } = await supabase
      .from('members')
      .update({ telegram: telegram || null })
      .eq('id', id);

    if (error) {
      console.error('Error updating member telegram:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === id ? { ...m, telegram: telegram || undefined } : m
              ),
            }
          : t
      )
    );
  }, [activeTeamId]);

  const updateMemberPayment = useCallback(async (id: string, isPaid: boolean, paidAmount?: number) => {
    const { error } = await supabase
      .from('members')
      .update({
        is_paid: isPaid,
        paid_amount: isPaid ? paidAmount || null : null,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating member payment:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === id
                  ? { ...m, isPaid, paidAmount: isPaid ? paidAmount : undefined }
                  : m
              ),
            }
          : t
      )
    );
  }, [activeTeamId]);

  const updateMemberSubscriptions = useCallback(async (id: string, subscriptions: SubscriptionType[]) => {
    const { error } = await supabase
      .from('members')
      .update({ subscriptions })
      .eq('id', id);

    if (error) {
      console.error('Error updating member subscriptions:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === id ? { ...m, subscriptions } : m
              ),
            }
          : t
      )
    );
  }, [activeTeamId]);

  const updateMemberPendingAmount = useCallback(async (id: string, pendingAmount?: number) => {
    const { error } = await supabase
      .from('members')
      .update({ pending_amount: pendingAmount || null })
      .eq('id', id);

    if (error) {
      console.error('Error updating member pending amount:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === id ? { ...m, pendingAmount } : m
              ),
            }
          : t
      )
    );
  }, [activeTeamId]);

  const updateMemberTwoFA = useCallback(async (id: string, twoFA: string) => {
    // Try new column name first, fallback to old one
    let error = null;
    
    // Try with 'twofa' column first
    const result1 = await supabase
      .from('members')
      .update({ twofa: twoFA || null })
      .eq('id', id);
    
    if (result1.error?.code === 'PGRST204' || result1.error?.message?.includes('twofa')) {
      // Fallback to 'two_fa' column
      const result2 = await supabase
        .from('members')
        .update({ two_fa: twoFA || null })
        .eq('id', id);
      error = result2.error;
    } else {
      error = result1.error;
    }

    if (error) {
      console.error('Error updating member 2FA:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === id ? { ...m, twoFA: twoFA || undefined } : m
              ),
            }
          : t
      )
    );
  }, [activeTeamId]);

  const updateMemberPassword = useCallback(async (id: string, password: string) => {
    const { error } = await supabase
      .from('members')
      .update({ password: password || null })
      .eq('id', id);

    if (error) {
      console.error('Error updating member password:', error);
      return;
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === id ? { ...m, password: password || undefined } : m
              ),
            }
          : t
      )
    );
  }, [activeTeamId]);

  const searchMembers = useCallback((query: string) => {
    if (!query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const results: Array<{ team: Team; member: Member; isAdmin: boolean }> = [];

    teams.forEach((team) => {
      if (team.adminEmail.toLowerCase().includes(normalizedQuery)) {
        results.push({
          team,
          member: { id: 'admin', email: team.adminEmail, phone: '', joinDate: team.createdAt },
          isAdmin: true,
        });
      }

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

  const canAddMember = activeTeam ? activeTeam.members.length + 1 < MAX_MEMBERS : false;
  const isTeamFull = activeTeam ? activeTeam.members.length + 1 >= MAX_MEMBERS : false;

  const exportData = useCallback(() => {
    const exportObj = { teams, exportedAt: new Date().toISOString() };
    const json = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elite-notepade-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [teams]);

  const importData = useCallback((jsonString: string) => {
    // Import is now optional/backup only - data lives in Supabase
    console.log('Import data is available for reference only:', jsonString);
    return true;
  }, []);

  const setLastBackup = useCallback(async (date: string) => {
    if (!activeTeamId) return;

    await supabase
      .from('teams')
      .update({ last_backup: date })
      .eq('id', activeTeamId);
  }, [activeTeamId]);

  return {
    data: { teams, activeTeamId: activeTeamId || '' },
    activeTeam,
    sortedTeams,
    isLoaded,
    setActiveTeam,
    createNewTeam,
    deleteTeam,
    updateTeamName,
    updateAdminEmail,
    updateTeamCreatedAt,
    addMember,
    removeMember,
    updateMemberDate,
    updateMemberEmail,
    updateMemberPhone,
    updateMemberTelegram,
    updateMemberTwoFA,
    updateMemberPassword,
    updateMemberPayment,
    updateMemberSubscriptions,
    updateMemberPendingAmount,
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
