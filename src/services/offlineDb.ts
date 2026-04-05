import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Team, Member, SubscriptionType } from '@/types/member';

// ─── IndexedDB Schema ───────────────────────────────────────────

interface EliteDB extends DBSchema {
  teams: {
    key: string;
    value: {
      id: string;
      user_id: string;
      team_name: string;
      admin_email: string;
      logo: string | null;
      created_at: string;
      last_backup: string | null;
      is_yearly: boolean;
      is_plus: boolean;
    };
    indexes: { 'by-user': string };
  };
  members: {
    key: string;
    value: {
      id: string;
      team_id: string;
      user_id: string;
      email: string;
      phone: string;
      telegram: string | null;
      twofa_secret: string | null;
      password: string | null;
      e_pass: string | null;
      g_pass: string | null;
      join_date: string;
      is_paid: boolean;
      paid_amount: number | null;
      pending_amount: number | null;
      subscriptions: string[] | null;
      is_pushed: boolean;
      active_team_id: string | null;
      created_at: string;
    };
    indexes: { 'by-user': string; 'by-team': string };
  };
  sync_queue: {
    key: number;
    value: {
      id?: number;
      table: 'teams' | 'members';
      operation: 'insert' | 'update' | 'delete';
      record_id: string;
      payload: Record<string, unknown>;
      created_at: string;
      user_id: string;
    };
    indexes: { 'by-user': string };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

const DB_NAME = 'elite-notepade-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<EliteDB> | null = null;

export const getDb = async (): Promise<IDBPDatabase<EliteDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<EliteDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Teams store
      const teamsStore = db.createObjectStore('teams', { keyPath: 'id' });
      teamsStore.createIndex('by-user', 'user_id');

      // Members store
      const membersStore = db.createObjectStore('members', { keyPath: 'id' });
      membersStore.createIndex('by-user', 'user_id');
      membersStore.createIndex('by-team', 'team_id');

      // Sync queue
      const syncStore = db.createObjectStore('sync_queue', {
        keyPath: 'id',
        autoIncrement: true,
      });
      syncStore.createIndex('by-user', 'user_id');

      // Metadata
      db.createObjectStore('meta', { keyPath: 'key' });
    },
  });

  return dbInstance;
};

// ─── Team Operations ────────────────────────────────────────────

export const saveTeamsLocally = async (teams: EliteDB['teams']['value'][]): Promise<void> => {
  const db = await getDb();
  const tx = db.transaction('teams', 'readwrite');
  for (const team of teams) {
    await tx.store.put(team);
  }
  await tx.done;
};

export const saveMembersLocally = async (members: EliteDB['members']['value'][]): Promise<void> => {
  const db = await getDb();
  const tx = db.transaction('members', 'readwrite');
  for (const member of members) {
    await tx.store.put(member);
  }
  await tx.done;
};

export const getLocalTeams = async (userId: string): Promise<EliteDB['teams']['value'][]> => {
  const db = await getDb();
  return db.getAllFromIndex('teams', 'by-user', userId);
};

export const getLocalMembers = async (userId: string): Promise<EliteDB['members']['value'][]> => {
  const db = await getDb();
  return db.getAllFromIndex('members', 'by-user', userId);
};

export const putLocalTeam = async (team: EliteDB['teams']['value']): Promise<void> => {
  const db = await getDb();
  await db.put('teams', team);
};

export const putLocalMember = async (member: EliteDB['members']['value']): Promise<void> => {
  const db = await getDb();
  await db.put('members', member);
};

export const deleteLocalTeam = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete('teams', id);
};

export const deleteLocalMember = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete('members', id);
};

export const deleteLocalMembersByTeam = async (teamId: string): Promise<void> => {
  const db = await getDb();
  const members = await db.getAllFromIndex('members', 'by-team', teamId);
  const tx = db.transaction('members', 'readwrite');
  for (const m of members) {
    await tx.store.delete(m.id);
  }
  await tx.done;
};

// ─── Sync Queue ─────────────────────────────────────────────────

export const addToSyncQueue = async (
  entry: Omit<EliteDB['sync_queue']['value'], 'id'>
): Promise<void> => {
  const db = await getDb();
  await db.add('sync_queue', entry as EliteDB['sync_queue']['value']);
};

export const getSyncQueue = async (userId: string): Promise<EliteDB['sync_queue']['value'][]> => {
  const db = await getDb();
  return db.getAllFromIndex('sync_queue', 'by-user', userId);
};

export const clearSyncQueue = async (ids: number[]): Promise<void> => {
  const db = await getDb();
  const tx = db.transaction('sync_queue', 'readwrite');
  for (const id of ids) {
    await tx.store.delete(id);
  }
  await tx.done;
};

// ─── Meta (last sync time, etc.) ────────────────────────────────

export const setMeta = async (key: string, value: string): Promise<void> => {
  const db = await getDb();
  await db.put('meta', { key, value });
};

export const getMeta = async (key: string): Promise<string | undefined> => {
  const db = await getDb();
  const entry = await db.get('meta', key);
  return entry?.value;
};

// ─── Mapping helpers ────────────────────────────────────────────

export const teamToLocal = (
  dbTeam: { id: string; user_id?: string; team_name: string; admin_email: string; logo: string | null; created_at: string; last_backup: string | null; is_yearly?: boolean | null; is_plus?: boolean | null },
  userId: string
): EliteDB['teams']['value'] => ({
  id: dbTeam.id,
  user_id: dbTeam.user_id || userId,
  team_name: dbTeam.team_name,
  admin_email: dbTeam.admin_email,
  logo: dbTeam.logo,
  created_at: dbTeam.created_at,
  last_backup: dbTeam.last_backup,
  is_yearly: dbTeam.is_yearly || false,
  is_plus: dbTeam.is_plus || false,
});

export const memberToLocal = (
  dbMember: Record<string, any>,
  userId: string
): EliteDB['members']['value'] => ({
  id: dbMember.id,
  team_id: dbMember.team_id,
  user_id: dbMember.user_id || userId,
  email: dbMember.email,
  phone: dbMember.phone || '',
  telegram: dbMember.telegram || null,
  twofa_secret: dbMember.twofa_secret ?? dbMember.twofa ?? dbMember.two_fa ?? null,
  password: dbMember.password || null,
  e_pass: dbMember.e_pass || null,
  g_pass: dbMember.g_pass || null,
  join_date: dbMember.join_date,
  is_paid: dbMember.is_paid || false,
  paid_amount: dbMember.paid_amount || null,
  pending_amount: dbMember.pending_amount || null,
  subscriptions: dbMember.subscriptions || null,
  is_pushed: dbMember.is_pushed || false,
  active_team_id: dbMember.active_team_id || null,
  created_at: dbMember.created_at || new Date().toISOString(),
});

export const localTeamToAppTeam = (
  localTeam: EliteDB['teams']['value'],
  members: Member[]
): Team => ({
  id: localTeam.id,
  teamName: localTeam.team_name,
  adminEmail: localTeam.admin_email,
  members,
  createdAt: localTeam.created_at,
  lastBackup: localTeam.last_backup || undefined,
  logo: localTeam.logo as SubscriptionType | undefined,
  isYearlyTeam: localTeam.is_yearly,
  isPlusTeam: localTeam.is_plus,
});

export const localMemberToAppMember = (
  localMember: EliteDB['members']['value']
): Member => ({
  id: localMember.id,
  email: localMember.email,
  phone: localMember.phone,
  telegram: localMember.telegram || undefined,
  twoFA: localMember.twofa_secret || undefined,
  password: localMember.password || undefined,
  ePass: localMember.e_pass || undefined,
  gPass: localMember.g_pass || undefined,
  joinDate: localMember.join_date,
  isPaid: localMember.is_paid,
  paidAmount: localMember.paid_amount || undefined,
  pendingAmount: localMember.pending_amount || undefined,
  subscriptions: (localMember.subscriptions as SubscriptionType[]) || undefined,
  isPushed: localMember.is_pushed || false,
  activeTeamId: localMember.active_team_id || undefined,
});
