import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Team, Member, MAX_MEMBERS, SubscriptionType } from '@/types/member';
import {
  getLocalTeams,
  getLocalMembers,
  putLocalTeam,
  putLocalMember,
  deleteLocalTeam,
  deleteLocalMember,
  deleteLocalMembersByTeam,
  addToSyncQueue,
  localTeamToAppTeam,
  localMemberToAppMember,
  teamToLocal,
  memberToLocal,
} from '@/services/offlineDb';
import { fullSync, isOnline, processSyncQueue } from '@/services/syncService';

// ─── DB ↔ App mapping (for direct Supabase responses) ────────────

interface DbTeam {
  id: string;
  user_id: string;
  team_name: string;
  admin_email: string;
  logo: string | null;
  created_at: string;
  last_backup: string | null;
  is_yearly: boolean | null;
  is_plus: boolean | null;
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
  twofa_secret: string | null;
  otp_secret?: string | null;
  password: string | null;
  e_pass: string | null;
  g_pass: string | null;
  join_date: string;
  is_paid: boolean;
  paid_amount: number | null;
  pending_amount: number | null;
  subscriptions: string[] | null;
  created_at: string;
  is_pushed?: boolean | null;
  active_team_id?: string | null;
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
  isPlusTeam: dbTeam.is_plus || false,
});

const mapDbMemberToMember = (dbMember: DbMember): Member => ({
  id: dbMember.id,
  email: dbMember.email,
  phone: dbMember.phone,
  telegram: dbMember.telegram || undefined,
  twoFA: dbMember.twofa ?? dbMember.two_fa ?? dbMember.twofa_secret ?? undefined,
  password: dbMember.password || undefined,
  ePass: dbMember.e_pass || undefined,
  gPass: dbMember.g_pass || undefined,
  joinDate: dbMember.join_date,
  isPaid: dbMember.is_paid,
  paidAmount: dbMember.paid_amount || undefined,
  pendingAmount: dbMember.pending_amount || undefined,
  subscriptions: (dbMember.subscriptions as SubscriptionType[]) || undefined,
  isPushed: dbMember.is_pushed || false,
  activeTeamId: dbMember.active_team_id || undefined,
});

// ─── Helper: build teams from local DB ──────────────────────────

const buildTeamsFromLocal = async (userId: string): Promise<Team[]> => {
  const localTeams = await getLocalTeams(userId);
  const localMembers = await getLocalMembers(userId);

  const membersByTeam: Record<string, Member[]> = {};
  localMembers.forEach((lm) => {
    if (!membersByTeam[lm.team_id]) membersByTeam[lm.team_id] = [];
    membersByTeam[lm.team_id].push(localMemberToAppMember(lm));
  });

  return localTeams
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((lt) => localTeamToAppTeam(lt, membersByTeam[lt.id] || []));
};

// ─── Helper: queue + optional remote push ───────────────────────

const queueAndSync = async (
  userId: string,
  table: 'teams' | 'members',
  operation: 'insert' | 'update' | 'delete',
  recordId: string,
  payload: Record<string, unknown>
) => {
  await addToSyncQueue({
    table,
    operation,
    record_id: recordId,
    payload,
    created_at: new Date().toISOString(),
    user_id: userId,
  });

  // Try to sync immediately if online
  if (isOnline()) {
    processSyncQueue(userId).catch((e) => console.error('[Sync] background error:', e));
  }
};

// ═══════════════════════════════════════════════════════════════
// Main Hook
// ═══════════════════════════════════════════════════════════════

export function useSupabaseData() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOnlineState, setIsOnlineState] = useState(navigator.onLine);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Online/Offline listener ───────────────────────────────

  useEffect(() => {
    const goOnline = () => {
      setIsOnlineState(true);
      if (user) {
        console.log('[Sync] Back online — syncing…');
        fullSync(user.id).then((result) => {
          if (result) rebuildFromLocal();
        });
      }
    };
    const goOffline = () => {
      setIsOnlineState(false);
      console.log('[Sync] Went offline');
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [user]);

  // ─── Periodic sync (every 2 min when online) ──────────────

  useEffect(() => {
    if (!user) return;
    syncIntervalRef.current = setInterval(() => {
      if (isOnline() && user) {
        processSyncQueue(user.id).catch(console.error);
      }
    }, 120_000);
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [user]);

  // ─── Rebuild UI state from IndexedDB ──────────────────────

  const rebuildFromLocal = useCallback(async () => {
    if (!user) return;
    const localTeams = await buildTeamsFromLocal(user.id);
    setTeams(localTeams);
    if (localTeams.length > 0 && !activeTeamId) {
      setActiveTeamId(localTeams[0].id);
    }
  }, [user, activeTeamId]);

  // ─── Initial data load ────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!user) {
      setTeams([]);
      setActiveTeamId(null);
      setIsLoaded(true);
      return;
    }

    // Step 1: Load from IndexedDB instantly (offline-first)
    try {
      const localTeams = await buildTeamsFromLocal(user.id);
      if (localTeams.length > 0) {
        setTeams(localTeams);
        if (!activeTeamId) setActiveTeamId(localTeams[0].id);
        setIsLoaded(true);
      }
    } catch (e) {
      console.error('[Offline] Failed to load local data:', e);
    }

    // Step 2: Pull from Supabase in background (if online)
    if (isOnline()) {
      try {
        const result = await fullSync(user.id);
        if (result) {
          const freshTeams = await buildTeamsFromLocal(user.id);
          setTeams(freshTeams);
          if (freshTeams.length > 0 && !activeTeamId) {
            setActiveTeamId(freshTeams[0].id);
          }
        }
      } catch (e) {
        console.error('[Sync] Background sync failed:', e);
      }
    }

    setIsLoaded(true);
  }, [user, activeTeamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived state ────────────────────────────────────────

  const activeTeam = useMemo(
    () => teams.find((t) => t.id === activeTeamId) || teams[0] || null,
    [teams, activeTeamId]
  );

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

  // ═══════════════════════════════════════════════════════════
  // CRUD — Local-first: IndexedDB → UI → queue sync
  // ═══════════════════════════════════════════════════════════

  const createNewTeam = useCallback(
    async (teamName?: string, logo?: SubscriptionType, isYearly?: boolean, isPlus?: boolean) => {
      if (!user) return null;

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const teamPayload = {
        id,
        user_id: user.id,
        team_name: teamName || 'My Elite Team',
        admin_email: (isYearly || isPlus) ? '' : (user.email || 'admin@example.com'),
        logo: logo || null,
        created_at: now,
        last_backup: null,
        is_yearly: isYearly || false,
        is_plus: isPlus || false,
      };

      // Save locally
      await putLocalTeam(teamPayload);
      const newTeam = localTeamToAppTeam(teamPayload, []);
      setTeams((prev) => [newTeam, ...prev]);
      setActiveTeamId(newTeam.id);

      // Queue sync
      await queueAndSync(user.id, 'teams', 'insert', id, teamPayload);
      return newTeam;
    },
    [user]
  );

  const deleteTeam = useCallback(
    async (teamId: string) => {
      if (!user) return;
      await deleteLocalMembersByTeam(teamId);
      await deleteLocalTeam(teamId);

      setTeams((prev) => {
        const remaining = prev.filter((t) => t.id !== teamId);
        if (activeTeamId === teamId && remaining.length > 0) setActiveTeamId(remaining[0].id);
        return remaining;
      });

      await queueAndSync(user.id, 'teams', 'delete', teamId, {});
    },
    [user, activeTeamId]
  );

  // ─── Team field updaters (local-first) ─────────────────────

  const updateTeamField = useCallback(
    async (field: string, dbField: string, value: unknown) => {
      if (!user || !activeTeamId) return;
      const localTeams = await getLocalTeams(user.id);
      const existing = localTeams.find((t) => t.id === activeTeamId);
      if (existing) {
        (existing as any)[dbField] = value;
        await putLocalTeam(existing);
      }
      setTeams((prev) => prev.map((t) => (t.id === activeTeamId ? { ...t, [field]: value } : t)));
      await queueAndSync(user.id, 'teams', 'update', activeTeamId, { id: activeTeamId, [dbField]: value });
    },
    [user, activeTeamId]
  );

  const updateTeamName = useCallback((name: string) => updateTeamField('teamName', 'team_name', name), [updateTeamField]);
  const updateAdminEmail = useCallback((email: string) => updateTeamField('adminEmail', 'admin_email', email), [updateTeamField]);
  const updateTeamCreatedAt = useCallback((createdAt: string) => updateTeamField('createdAt', 'created_at', createdAt), [updateTeamField]);

  const updateTeamLogo = useCallback(
    async (teamId: string, logo: SubscriptionType) => {
      if (!user) return;
      const localTeams = await getLocalTeams(user.id);
      const existing = localTeams.find((t) => t.id === teamId);
      if (existing) {
        existing.logo = logo;
        await putLocalTeam(existing);
      }
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, logo } : t)));
      await queueAndSync(user.id, 'teams', 'update', teamId, { id: teamId, logo });
    },
    [user]
  );

  // ─── Add Member (local-first) ──────────────────────────────

  const addMember = useCallback(
    async (
      member: Omit<Member, 'id'>,
      targetTeamId?: string,
      skipLimitCheck?: boolean
    ): Promise<{ ok: boolean; error?: string; code?: string }> => {
      const teamIdToUse = targetTeamId || activeTeamId;
      if (!user || !teamIdToUse) return { ok: false, error: 'Not authenticated' };

      const team = teams.find((t) => t.id === teamIdToUse);
      if (!team) return { ok: false, error: 'Team not found' };

      if (!team.isYearlyTeam && !team.isPlusTeam && !skipLimitCheck && team.members.length + 1 >= MAX_MEMBERS) {
        return { ok: false, error: `Maximum ${MAX_MEMBERS} members allowed` };
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const localMember = {
        id,
        team_id: teamIdToUse,
        user_id: user.id,
        email: member.email,
        phone: member.phone || '',
        telegram: member.telegram || null,
        twofa_secret: member.twoFA || null,
        password: member.password || null,
        e_pass: member.ePass || null,
        g_pass: member.gPass || null,
        join_date: member.joinDate,
        is_paid: member.isPaid || false,
        paid_amount: member.paidAmount || null,
        pending_amount: member.pendingAmount || null,
        subscriptions: (member.subscriptions as string[]) || null,
        is_pushed: member.isPushed || false,
        active_team_id: member.activeTeamId || null,
        created_at: now,
      };

      await putLocalMember(localMember);
      const appMember = localMemberToAppMember(localMember);
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamIdToUse ? { ...t, members: [...t.members, appMember] } : t
        )
      );

      await queueAndSync(user.id, 'members', 'insert', id, localMember);
      return { ok: true };
    },
    [user, activeTeamId, teams]
  );

  // ─── Remove Member ─────────────────────────────────────────

  const removeMember = useCallback(
    async (id: string) => {
      if (!user) return;
      await deleteLocalMember(id);
      setTeams((prev) =>
        prev.map((t) =>
          t.id === activeTeamId
            ? { ...t, members: t.members.filter((m) => m.id !== id) }
            : t
        )
      );
      await queueAndSync(user.id, 'members', 'delete', id, {});
    },
    [user, activeTeamId]
  );

  // ─── Generic member field updater (local-first) ────────────

  const updateMemberField = useCallback(
    async (id: string, appField: string, dbField: string, value: unknown, allTeams?: boolean) => {
      if (!user) return;

      // Update local DB
      const localMembers = await getLocalMembers(user.id);
      const existing = localMembers.find((m) => m.id === id);
      if (existing) {
        (existing as any)[dbField] = value;
        await putLocalMember(existing);
      }

      // Update React state
      const updater = (t: Team) => ({
        ...t,
        members: t.members.map((m) => (m.id === id ? { ...m, [appField]: value } : m)),
      });

      if (allTeams) {
        setTeams((prev) => prev.map(updater));
      } else {
        setTeams((prev) =>
          prev.map((t) => (t.id === activeTeamId ? updater(t) : t))
        );
      }

      await queueAndSync(user.id, 'members', 'update', id, { id, [dbField]: value });
    },
    [user, activeTeamId]
  );

  const updateMemberDate = useCallback((id: string, joinDate: string) => updateMemberField(id, 'joinDate', 'join_date', joinDate), [updateMemberField]);
  const updateMemberEmail = useCallback((id: string, email: string) => updateMemberField(id, 'email', 'email', email), [updateMemberField]);
  const updateMemberPhone = useCallback((id: string, phone: string) => updateMemberField(id, 'phone', 'phone', phone), [updateMemberField]);
  const updateMemberTelegram = useCallback((id: string, telegram: string) => updateMemberField(id, 'telegram', 'telegram', telegram || null), [updateMemberField]);
  const updateMemberTwoFA = useCallback((id: string, twoFA: string) => updateMemberField(id, 'twoFA', 'twofa_secret', twoFA || null), [updateMemberField]);
  const updateMemberPassword = useCallback((id: string, password: string) => updateMemberField(id, 'password', 'password', password || null), [updateMemberField]);
  const updateMemberEPass = useCallback((id: string, ePass: string) => updateMemberField(id, 'ePass', 'e_pass', ePass || null), [updateMemberField]);
  const updateMemberGPass = useCallback((id: string, gPass: string) => updateMemberField(id, 'gPass', 'g_pass', gPass || null), [updateMemberField]);
  const updateMemberSubscriptions = useCallback((id: string, subscriptions: SubscriptionType[]) => updateMemberField(id, 'subscriptions', 'subscriptions', subscriptions), [updateMemberField]);
  const updateMemberPendingAmount = useCallback((id: string, pendingAmount?: number) => updateMemberField(id, 'pendingAmount', 'pending_amount', pendingAmount || null), [updateMemberField]);
  const updateMemberPushed = useCallback((id: string, isPushed: boolean) => updateMemberField(id, 'isPushed', 'is_pushed', isPushed, true), [updateMemberField]);
  const updateMemberActiveTeam = useCallback((id: string, activeTeamIdVal?: string) => updateMemberField(id, 'activeTeamId', 'active_team_id', activeTeamIdVal || null, true), [updateMemberField]);

  const updateMemberPayment = useCallback(
    async (id: string, isPaid: boolean, paidAmount?: number) => {
      if (!user) return;

      const localMembers = await getLocalMembers(user.id);
      const existing = localMembers.find((m) => m.id === id);
      if (existing) {
        existing.is_paid = isPaid;
        existing.paid_amount = isPaid ? paidAmount || null : null;
        await putLocalMember(existing);
      }

      setTeams((prev) =>
        prev.map((t) =>
          t.id === activeTeamId
            ? {
                ...t,
                members: t.members.map((m) =>
                  m.id === id ? { ...m, isPaid, paidAmount: isPaid ? paidAmount : undefined } : m
                ),
              }
            : t
        )
      );

      await queueAndSync(user.id, 'members', 'update', id, {
        id,
        is_paid: isPaid,
        paid_amount: isPaid ? paidAmount || null : null,
      });
    },
    [user, activeTeamId]
  );

  // ─── Search ────────────────────────────────────────────────

  const searchMembers = useCallback(
    (query: string) => {
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
          if (member.email.toLowerCase().includes(normalizedQuery) || member.phone.includes(normalizedQuery)) {
            results.push({ team, member, isAdmin: false });
          }
        });
      });
      return results;
    },
    [teams]
  );

  // ─── Export / Import / Backup ──────────────────────────────

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
    console.log('Import data is available for reference only:', jsonString);
    return true;
  }, []);

  const setLastBackup = useCallback(
    async (date: string) => {
      if (!user || !activeTeamId) return;
      const localTeams = await getLocalTeams(user.id);
      const existing = localTeams.find((t) => t.id === activeTeamId);
      if (existing) {
        existing.last_backup = date;
        await putLocalTeam(existing);
      }
      await queueAndSync(user.id, 'teams', 'update', activeTeamId, { id: activeTeamId, last_backup: date });
    },
    [user, activeTeamId]
  );

  return {
    data: { teams, activeTeamId: activeTeamId || '' },
    activeTeam,
    sortedTeams,
    isLoaded,
    isOnline: isOnlineState,
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
    updateMemberEPass,
    updateMemberGPass,
    updateMemberPayment,
    updateMemberSubscriptions,
    updateMemberPendingAmount,
    updateMemberPushed,
    updateMemberActiveTeam,
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
