import { supabase } from '@/lib/supabase';
import {
  getSyncQueue,
  clearSyncQueue,
  saveTeamsLocally,
  saveMembersLocally,
  getLocalTeams,
  getLocalMembers,
  teamToLocal,
  memberToLocal,
  setMeta,
} from './offlineDb';

/**
 * Check if we're currently online
 */
export const isOnline = (): boolean => navigator.onLine;

/**
 * Process the sync queue — push pending local changes to Supabase.
 * Returns the number of successfully synced items.
 */
export const processSyncQueue = async (userId: string): Promise<number> => {
  if (!isOnline()) return 0;

  const queue = await getSyncQueue(userId);
  if (queue.length === 0) return 0;

  console.log(`[Sync] Processing ${queue.length} queued operations…`);
  const completedIds: number[] = [];

  for (const entry of queue) {
    try {
      if (entry.table === 'teams') {
        if (entry.operation === 'insert') {
          const { error } = await supabase.from('teams').upsert(entry.payload as any);
          if (error) throw error;
        } else if (entry.operation === 'update') {
          const { id: _id, ...updatePayload } = entry.payload;
          const { error } = await supabase
            .from('teams')
            .update(updatePayload as any)
            .eq('id', entry.record_id);
          if (error) throw error;
        } else if (entry.operation === 'delete') {
          const { error } = await supabase.from('teams').delete().eq('id', entry.record_id);
          if (error) throw error;
        }
      } else if (entry.table === 'members') {
        if (entry.operation === 'insert') {
          // Remove optional columns that may not exist in some schemas
          const payload = { ...entry.payload };
          const { error } = await supabase.from('members').upsert(payload as any);
          if (error) {
            // Retry without optional columns if column doesn't exist
            if (error.code === 'PGRST204') {
              const msg = error.message || '';
              if (msg.includes("'two_fa'")) delete payload.two_fa;
              if (msg.includes("'password'")) delete payload.password;
              if (msg.includes("'twofa_secret'")) delete payload.twofa_secret;
              const { error: e2 } = await supabase.from('members').upsert(payload as any);
              if (e2) throw e2;
            } else {
              throw error;
            }
          }
        } else if (entry.operation === 'update') {
          const { id: _id, ...updatePayload } = entry.payload;
          const { error } = await supabase
            .from('members')
            .update(updatePayload as any)
            .eq('id', entry.record_id);
          if (error) throw error;
        } else if (entry.operation === 'delete') {
          const { error } = await supabase.from('members').delete().eq('id', entry.record_id);
          if (error) throw error;
        }
      }

      completedIds.push(entry.id!);
    } catch (err) {
      console.error(`[Sync] Failed to sync ${entry.table}/${entry.operation}:`, err);
      // Don't add to completedIds — will retry next time
    }
  }

  if (completedIds.length > 0) {
    await clearSyncQueue(completedIds);
    await setMeta('last_sync', new Date().toISOString());
    console.log(`[Sync] Synced ${completedIds.length}/${queue.length} operations`);
  }

  return completedIds.length;
};

/**
 * Pull latest data from Supabase and save to IndexedDB.
 * Returns the remote data for immediate UI use.
 */
export const pullFromRemote = async (userId: string) => {
  if (!isOnline()) return null;

  try {
    const [teamsRes, membersRes] = await Promise.all([
      supabase.from('teams').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('members').select('*').eq('user_id', userId),
    ]);

    if (teamsRes.error || membersRes.error) {
      console.error('[Sync] Pull error:', teamsRes.error || membersRes.error);
      return null;
    }

    const localTeams = (teamsRes.data || []).map((t: any) => teamToLocal(t, userId));
    const localMembers = (membersRes.data || []).map((m: any) => memberToLocal(m, userId));

    await saveTeamsLocally(localTeams);
    await saveMembersLocally(localMembers);
    await setMeta('last_sync', new Date().toISOString());

    return { teams: localTeams, members: localMembers };
  } catch (err) {
    console.error('[Sync] Pull failed:', err);
    return null;
  }
};

/**
 * Full sync: push pending changes, then pull latest from remote.
 */
export const fullSync = async (userId: string) => {
  if (!isOnline()) return null;

  await processSyncQueue(userId);
  return pullFromRemote(userId);
};
