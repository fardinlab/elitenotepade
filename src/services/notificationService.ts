import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { differenceInDays } from 'date-fns';
import { Team, Member } from '@/types/member';

// Parse "YYYY-MM-DD" as local date (avoid UTC shift)
const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const getTodayLocal = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

interface ExpiringMember {
  member: Member;
  team: Team;
  daysUntilExpiry: number; // 0 = today, 1 = tomorrow
}

/**
 * Find members whose subscription expires on a specific date (30 days from join)
 */
const findExpiringOnDate = (teams: Team[], targetDate: Date, isPlus: boolean): ExpiringMember[] => {
  const results: ExpiringMember[] = [];

  teams.forEach((team) => {
    if (isPlus ? !team.isPlusTeam : (team.isYearlyTeam || team.isPlusTeam)) return;

    team.members.forEach((member) => {
      if (member.isPushed || (!isPlus && member.activeTeamId)) return;

      const joinDate = parseLocalDate(member.joinDate);
      const daysSinceJoin = differenceInDays(targetDate, joinDate);

      if (daysSinceJoin === 29) {
        results.push({ member, team, daysUntilExpiry: 1 });
      } else if (isPlus ? daysSinceJoin >= 30 : daysSinceJoin === 30) {
        results.push({ member, team, daysUntilExpiry: 0 });
      }
    });
  });

  return results;
};

/**
 * Find members whose subscription is expiring today or tomorrow
 */
export const findExpiringMembers = (teams: Team[]): ExpiringMember[] => {
  const today = getTodayLocal();
  return findExpiringOnDate(teams, today, false);
};

/**
 * Find Plus team members whose 30-day period is about to expire
 */
export const findExpiringPlusMembers = (teams: Team[]): ExpiringMember[] => {
  const today = getTodayLocal();
  return findExpiringOnDate(teams, today, true);
};

/**
 * Ensure notification channel exists (required for Android 8+)
 */
const ensureNotificationChannel = async (): Promise<void> => {
  try {
    await LocalNotifications.createChannel({
      id: 'expiry-alerts',
      name: 'Subscription Expiry Alerts',
      description: 'Alerts for member subscription expiry',
      importance: 5,
      visibility: 1,
      sound: 'default',
      vibration: true,
    });
    console.log('Notification channel created/ensured');
  } catch (error) {
    console.error('Error creating notification channel:', error);
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Notifications only work on native platforms');
    return false;
  }

  const permission = await LocalNotifications.requestPermissions();
  return permission.display === 'granted';
};

/**
 * Check if advance notifications were already scheduled recently
 */
const wasScheduledRecently = (): boolean => {
  const lastScheduled = localStorage.getItem('lastNotificationSchedule');
  if (!lastScheduled) return false;
  const today = getTodayLocal().toISOString().split('T')[0];
  return lastScheduled === today;
};

const markScheduledToday = (): void => {
  const today = getTodayLocal().toISOString().split('T')[0];
  localStorage.setItem('lastNotificationSchedule', today);
};

/**
 * Build a notification object for a member
 */
const buildNotification = (item: ExpiringMember, id: number, scheduleAt: Date) => {
  const isPlus = item.team.isPlusTeam;
  const teamType = isPlus ? '🟣 Plus' : '🔵 Normal';
  const timeLabel = item.daysUntilExpiry === 1 ? 'আগামীকাল' : 'আজকে';
  const emoji = item.daysUntilExpiry === 0 ? '🔴' : '🟡';

  const [y, m, d] = item.member.joinDate.split('-').map(Number);
  const joinDate = new Date(y, m - 1, d);
  const expiryDate = new Date(joinDate);
  expiryDate.setDate(expiryDate.getDate() + 30);
  const expiryStr = `${expiryDate.getDate()}/${expiryDate.getMonth() + 1}/${expiryDate.getFullYear()}`;
  const joinStr = `${joinDate.getDate()}/${joinDate.getMonth() + 1}/${joinDate.getFullYear()}`;
  const phone = item.member.phone ? `\n📞 ${item.member.phone}` : '';

  return {
    id,
    title: `${emoji} সাবস্ক্রিপশন ${timeLabel} শেষ!`,
    body: `[${teamType}] ${item.team.teamName}\n📧 ${item.member.email}${phone}\n📅 জয়েন: ${joinStr} → শেষ: ${expiryStr}`,
    channelId: 'expiry-alerts',
    schedule: {
      at: scheduleAt,
      allowWhileIdle: true,
    },
    sound: 'default' as const,
    smallIcon: 'ic_notification',
    largeIcon: 'ic_notification',
    extra: {
      memberId: item.member.id,
      teamId: item.team.id,
      teamType: isPlus ? 'plus' : 'normal',
    },
  };
};

/**
 * Schedule notifications for the next 7 days at 12:00 AM and 12:00 PM.
 * These are system-level scheduled notifications that fire even when the app is closed.
 */
export const scheduleExpiryNotifications = async (teams: Team[]): Promise<void> => {
  console.log('📢 [NOTIF] scheduleExpiryNotifications called');
  console.log('📢 [NOTIF] isNativePlatform:', Capacitor.isNativePlatform());
  console.log('📢 [NOTIF] teams count:', teams.length);
  
  // Log all members and their join dates for debugging
  let totalMembers = 0;
  teams.forEach(t => {
    totalMembers += t.members.length;
    t.members.forEach(m => {
      const joinDate = parseLocalDate(m.joinDate);
      const today = getTodayLocal();
      const daysSince = differenceInDays(today, joinDate);
      console.log(`📢 [NOTIF] Member: ${m.email}, joinDate: ${m.joinDate}, daysSinceJoin: ${daysSince}, isPushed: ${m.isPushed}`);
    });
  });
  console.log('📢 [NOTIF] total members:', totalMembers);

  if (!Capacitor.isNativePlatform()) {
    console.log('📢 [NOTIF] Skipping - not native platform');
    return;
  }

  if (wasScheduledRecently()) {
    console.log('📢 [NOTIF] Already scheduled today, skipping');
    return;
  }

  const hasPermission = await requestNotificationPermission();
  console.log('📢 [NOTIF] hasPermission:', hasPermission);
  if (!hasPermission) {
    return;
  }

  await ensureNotificationChannel();

  const pending = await LocalNotifications.getPending();
  console.log('📢 [NOTIF] Pending notifications to cancel:', pending.notifications.length);
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications });
  }

  const now = new Date();
  const allNotifications: any[] = [];
  let notifId = 1;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    const normalExpiring = findExpiringOnDate(teams, targetDate, false);
    const plusExpiring = findExpiringOnDate(teams, targetDate, true);
    const allExpiring = [...normalExpiring, ...plusExpiring];

    console.log(`📢 [NOTIF] Day +${dayOffset}: ${allExpiring.length} expiring members`);

    if (allExpiring.length === 0) continue;

    const midnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const noon = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 12, 0, 0);
    const scheduleTimes = [midnight, noon].filter(t => t.getTime() > now.getTime());

    console.log(`📢 [NOTIF] Day +${dayOffset}: ${scheduleTimes.length} valid schedule times`);

    for (const scheduleAt of scheduleTimes) {
      for (const item of allExpiring) {
        allNotifications.push(buildNotification(item, notifId++, scheduleAt));
      }
    }
  }

  console.log('📢 [NOTIF] Total notifications to schedule:', allNotifications.length);

  if (allNotifications.length === 0) {
    console.log('📢 [NOTIF] No expiring members found for next 7 days');
    
    // Fire an IMMEDIATE test notification (no schedule delay)
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: 99999,
          title: '🔔 টেস্ট নোটিফিকেশন',
          body: `নোটিফিকেশন সিস্টেম কাজ করছে! Teams: ${teams.length}, Members: ${totalMembers}`,
          channelId: 'expiry-alerts',
          sound: 'default' as const,
          smallIcon: 'ic_notification',
        }]
      });
      console.log('📢 [NOTIF] Immediate test notification fired');
    } catch (err) {
      console.error('📢 [NOTIF] Test notification error:', err);
    }
    return;
  }

  try {
    await LocalNotifications.schedule({ notifications: allNotifications });
    markScheduledToday();
    console.log(`📢 [NOTIF] Successfully scheduled ${allNotifications.length} notifications`);
  } catch (error) {
    console.error('📢 [NOTIF] Error scheduling:', error);
  }
};

/**
 * Initialize the notification system
 */
export const initializeNotifications = async (teams: Team[]): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  // Listen for notification taps — navigate to the specific member's team page
  await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    console.log('Notification tapped:', notification);
    const extra = notification.notification?.extra;
    if (extra?.memberId && extra?.teamId && extra?.teamType) {
      const teamType = extra.teamType as string;
      const route = teamType === 'yearly' ? 'yearly-team' : teamType === 'plus' ? 'plus-team' : 'team';
      window.location.href = `/${route}/${extra.teamId}?highlightMemberId=${extra.memberId}&highlightColor=rainbow`;
    } else if (extra?.memberId) {
      window.location.href = `/renew-subscription?memberId=${extra.memberId}`;
    } else {
      window.location.href = '/renew-subscription';
    }
  });

  // Schedule notifications based on current data
  await scheduleExpiryNotifications(teams);
};
