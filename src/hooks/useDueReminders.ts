import { useEffect, useRef } from 'react';
import { supabase as cloudSupabase } from '@/integrations/supabase/client';
import { Team, SUBSCRIPTION_CONFIG, SubscriptionType } from '@/types/member';

const DUE_REMINDER_INTERVAL_DAYS = 3;
const STORAGE_KEY = 'dueRemindersSent';

interface SentRecord {
  [email: string]: string; // email -> last sent date (YYYY-MM-DD)
}

/**
 * Hook that sends due payment reminder emails every 3 days
 * for members with pending_amount > 0 in Normal and Plus teams.
 */
export function useDueReminders(teams: Team[], isLoaded: boolean) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || teams.length === 0 || sentRef.current) return;
    sentRef.current = true;
    sendDueReminders(teams);
  }, [teams, isLoaded]);
}

function getSentRecords(): SentRecord {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function markSent(email: string) {
  const records = getSentRecords();
  records[email] = new Date().toISOString().split('T')[0];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

async function sendDueReminders(teams: Team[]) {
  const eligibleTeams = teams.filter(t => !t.isYearlyTeam);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const sentRecords = getSentRecords();

  for (const team of eligibleTeams) {
    const subscriptionName = team.logo
      ? SUBSCRIPTION_CONFIG[team.logo as SubscriptionType]?.name
      : undefined;

    for (const member of team.members) {
      if (member.isPushed || !member.email) continue;
      if (!member.pendingAmount || member.pendingAmount <= 0) continue;

      // Check local record for last sent date
      const lastSent = sentRecords[member.email];
      if (lastSent) {
        const lastDate = new Date(lastSent);
        const daysSince = Math.floor(
          (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince < DUE_REMINDER_INTERVAL_DAYS) {
          continue;
        }
      }

      try {
        await cloudSupabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'due-reminder',
            recipientEmail: member.email,
            idempotencyKey: `due-reminder-${member.id}-${todayStr}`,
            templateData: {
              teamName: team.teamName,
              subscriptionName,
              memberEmail: member.email,
              pendingAmount: String(member.pendingAmount),
              joinDate: member.joinDate,
            },
          },
        });
        markSent(member.email);
        console.log(`[DueReminder] Sent to ${member.email} (pending: ${member.pendingAmount})`);
      } catch (e) {
        console.error(`[DueReminder] Failed for ${member.email}:`, e);
      }
    }
  }
}
