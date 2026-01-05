import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppData, Team, Member, MAX_MEMBERS, SubscriptionType } from '@/types/member';

const STORAGE_KEY = 'elite_notepade_multi_data';

const createDefaultTeam = (teamName?: string, logo?: SubscriptionType): Team => ({
  id: Date.now().toString(),
  teamName: teamName || 'My Elite Team',
  adminEmail: 'admin@example.com',
  members: [],
  createdAt: new Date().toISOString(),
  logo,
});

const getDefaultData = (): AppData => {
  const defaultTeam = createDefaultTeam();
  return {
    teams: [defaultTeam],
    activeTeamId: defaultTeam.id,
  };
};

// Migrate old single-team data to multi-team format
const migrateOldData = (): AppData | null => {
  const oldData = localStorage.getItem('elite_notepade_data');
  if (oldData) {
    try {
      const parsed = JSON.parse(oldData);
      if (parsed.teamName && parsed.adminEmail && Array.isArray(parsed.members)) {
        const team: Team = {
          id: Date.now().toString(),
          teamName: parsed.teamName,
          adminEmail: parsed.adminEmail,
          members: parsed.members,
          createdAt: new Date().toISOString(),
          lastBackup: parsed.lastBackup,
        };
        return {
          teams: [team],
          activeTeamId: team.id,
        };
      }
    } catch {
      // Ignore migration errors
    }
  }
  return null;
};

export function useMultiTeamData() {
  const [data, setData] = useState<AppData>(getDefaultData());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        const migrated = migrateOldData();
        setData(migrated || getDefaultData());
      }
    } else {
      const migrated = migrateOldData();
      setData(migrated || getDefaultData());
    }
    setIsLoaded(true);
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  // Get active team
  const activeTeam = useMemo(() => {
    return data.teams.find((t) => t.id === data.activeTeamId) || data.teams[0];
  }, [data.teams, data.activeTeamId]);

  // Sort teams: current month first, then by creation date descending
  const sortedTeams = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return [...data.teams].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      
      const isCurrentMonthA = dateA.getMonth() === currentMonth && dateA.getFullYear() === currentYear;
      const isCurrentMonthB = dateB.getMonth() === currentMonth && dateB.getFullYear() === currentYear;

      if (isCurrentMonthA && !isCurrentMonthB) return -1;
      if (!isCurrentMonthA && isCurrentMonthB) return 1;
      
      return dateB.getTime() - dateA.getTime();
    });
  }, [data.teams]);

  const setActiveTeam = useCallback((teamId: string) => {
    setData((prev) => ({ ...prev, activeTeamId: teamId }));
  }, []);

  const createNewTeam = useCallback((teamName?: string, logo?: SubscriptionType) => {
    const newTeam = createDefaultTeam(teamName, logo);
    setData((prev) => ({
      ...prev,
      teams: [...prev.teams, newTeam],
      activeTeamId: newTeam.id,
    }));
    return newTeam;
  }, []);

  const deleteTeam = useCallback((teamId: string) => {
    setData((prev) => {
      const remainingTeams = prev.teams.filter((t) => t.id !== teamId);
      // If no teams left, create a default one
      if (remainingTeams.length === 0) {
        const newTeam = createDefaultTeam();
        return {
          teams: [newTeam],
          activeTeamId: newTeam.id,
        };
      }
      // If deleted team was active, switch to first team
      const newActiveId = prev.activeTeamId === teamId ? remainingTeams[0].id : prev.activeTeamId;
      return {
        ...prev,
        teams: remainingTeams,
        activeTeamId: newActiveId,
      };
    });
  }, []);

  const updateTeamName = useCallback((name: string) => {
    setData((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === prev.activeTeamId ? { ...t, teamName: name } : t
      ),
    }));
  }, []);

  const updateAdminEmail = useCallback((email: string) => {
    setData((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === prev.activeTeamId ? { ...t, adminEmail: email } : t
      ),
    }));
  }, []);

  const addMember = useCallback((member: Omit<Member, 'id'>) => {
    const team = data.teams.find((t) => t.id === data.activeTeamId);
    if (!team || team.members.length + 1 >= MAX_MEMBERS) {
      return false;
    }
    const newMember: Member = {
      ...member,
      id: Date.now().toString(),
    };
    setData((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === prev.activeTeamId
          ? { ...t, members: [...t.members, newMember] }
          : t
      ),
    }));
    return true;
  }, [data.teams, data.activeTeamId]);

  const removeMember = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === prev.activeTeamId
          ? { ...t, members: t.members.filter((m) => m.id !== id) }
          : t
      ),
    }));
  }, []);

  const updateMemberDate = useCallback((id: string, joinDate: string) => {
    setData((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === prev.activeTeamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === id ? { ...m, joinDate } : m
              ),
            }
          : t
      ),
    }));
  }, []);

  const updateMemberEmail = useCallback((id: string, email: string) => {
    setData((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === prev.activeTeamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === id ? { ...m, email } : m
              ),
            }
          : t
      ),
    }));
  }, []);

  const updateMemberTelegram = useCallback((id: string, telegram: string) => {
    setData((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === prev.activeTeamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === id ? { ...m, telegram: telegram || undefined } : m
              ),
            }
          : t
      ),
    }));
  }, []);

  const updateMemberPayment = useCallback((id: string, isPaid: boolean, paidAmount?: number) => {
    setData((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === prev.activeTeamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === id ? { ...m, isPaid, paidAmount: isPaid ? paidAmount : undefined } : m
              ),
            }
          : t
      ),
    }));
  }, []);

  const updateMemberSubscriptions = useCallback((id: string, subscriptions: SubscriptionType[]) => {
    setData((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === prev.activeTeamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.id === id ? { ...m, subscriptions } : m
              ),
            }
          : t
      ),
    }));
  }, []);

  const canAddMember = activeTeam ? activeTeam.members.length + 1 < MAX_MEMBERS : false;
  const isTeamFull = activeTeam ? activeTeam.members.length + 1 >= MAX_MEMBERS : false;

  const exportData = useCallback(() => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elite-notepade-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importData = useCallback((jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      // Handle multi-team format
      if (parsed.teams && Array.isArray(parsed.teams)) {
        setData(parsed);
        return true;
      }
      // Handle old single-team format
      if (parsed.teamName && parsed.adminEmail && Array.isArray(parsed.members)) {
        const team: Team = {
          id: Date.now().toString(),
          teamName: parsed.teamName,
          adminEmail: parsed.adminEmail,
          members: parsed.members,
          createdAt: new Date().toISOString(),
          lastBackup: parsed.lastBackup,
        };
        setData((prev) => ({
          ...prev,
          teams: [...prev.teams, team],
          activeTeamId: team.id,
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const setLastBackup = useCallback((date: string) => {
    setData((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === prev.activeTeamId ? { ...t, lastBackup: date } : t
      ),
    }));
  }, []);

  // Search across all teams
  const searchMembers = useCallback((query: string) => {
    if (!query.trim()) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    const results: Array<{ team: Team; member: Member; isAdmin: boolean }> = [];

    data.teams.forEach((team) => {
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
  }, [data.teams]);

  return {
    data,
    activeTeam,
    sortedTeams,
    isLoaded,
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
    canAddMember,
    isTeamFull,
    exportData,
    importData,
    setLastBackup,
    searchMembers,
    memberCount: activeTeam ? activeTeam.members.length + 1 : 1,
    teamCount: data.teams.length,
  };
}
