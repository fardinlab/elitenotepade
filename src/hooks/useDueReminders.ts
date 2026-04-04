import { useEffect, useRef } from 'react';
import { supabase as cloudSupabase } from '@/integrations/supabase/client';
import { Team, SUBSCRIPTION_CONFIG, SubscriptionType } from '@/types/member';

const DUE_REMINDER_INTERVAL_DAYS = 3;
const STORAGE_KEY = 'lastDueReminderCheck';

/**
 * Hook that sends due payment reminder emails every 3 days
 * for members with pending_amount > 0 in Normal and Plus teams.
 */
export function useDueReminders(teams: Team[], isLoaded: boolean) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || teams.length === 0 || sentRef.current) return;

    // Check if we already ran today
    const lastCheck = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];
    if (lastCheck === today) return;

    sentRef.current = true;
    sendDueReminders(teams).then(() => {
      localStorage.setItem(STORAGE_KEY, today);
    });
  }, [teams, isLoaded]);
}

async function sendDueReminders(teams: Team[]) {
  // Filter Normal + Plus teams only
  const eligibleTeams = teams.filter(t => !t.isYearlyTeam);

  const today = new Date();

  for (const team of eligibleTeams) {
    const subscriptionName = team.logo
      ? SUBSCRIPTION_CONFIG[team.logo as SubscriptionType]?.name
      : undefined;

    for (const member of team.members) {
      if (member.isPushed || !member.email) continue;
      if (!member.pendingAmount || member.pendingAmount <= 0) continue;

      // Check last due-reminder sent via email_send_log
      try {
        const { data: lastSent } = await cloudSupabase
          .from('email_send_log')
          .select('created_at')
          .eq('template_name', 'due-reminder')
          .eq('recipient_email', member.email)
          .order('created_at', { ascending: false })
          .limit(1);

        if (lastSent && lastSent.length > 0) {
          const lastDate = new Date(lastSent[0].created_at);
          const daysSince = Math.floor(
            (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSince < DUE_REMINDER_INTERVAL_DAYS) {
            console.log(`[DueReminder] Skipping ${member.email} - sent ${daysSince}d ago`);
            continue;
          }
        }

        const todayStr = today.toISOString().split('T')[0];
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
        console.log(`[DueReminder] Sent to ${member.email} (pending: ${member.pendingAmount})`);
      } catch (e) {
        console.error(`[DueReminder] Failed for ${member.email}:`, e);
      }
    }
  }
}
