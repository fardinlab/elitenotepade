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
 * Find members whose subscription is expiring (30 days from join date)
 * Returns members expiring today or tomorrow
 */
export const findExpiringMembers = (teams: Team[]): ExpiringMember[] => {
  const today = getTodayLocal();
  const results: ExpiringMember[] = [];

  teams.forEach((team) => {
    if (team.isYearlyTeam || team.isPlusTeam) return; // Yearly/Plus have different logic

    team.members.forEach((member) => {
      if (member.isPushed || member.activeTeamId) return; // Skip pushed/active

      const joinDate = parseLocalDate(member.joinDate);
      const daysSinceJoin = differenceInDays(today, joinDate);

      // Expiry at 30 days — notify at 29 (tomorrow) and 30 (today)
      if (daysSinceJoin === 29) {
        results.push({ member, team, daysUntilExpiry: 1 });
      } else if (daysSinceJoin === 30) {
        results.push({ member, team, daysUntilExpiry: 0 });
      }
    });
  });

  return results;
};

/**
 * Find Plus team members whose 30-day period is about to expire
 */
export const findExpiringPlusMembers = (teams: Team[]): ExpiringMember[] => {
  const today = getTodayLocal();
  const results: ExpiringMember[] = [];

  teams.forEach((team) => {
    if (!team.isPlusTeam) return;

    team.members.forEach((member) => {
      if (member.isPushed) return;

      const joinDate = parseLocalDate(member.joinDate);
      const daysSinceJoin = differenceInDays(today, joinDate);

      if (daysSinceJoin === 29) {
        results.push({ member, team, daysUntilExpiry: 1 });
      } else if (daysSinceJoin >= 30) {
        results.push({ member, team, daysUntilExpiry: 0 });
      }
    });
  });

  return results;
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
 * Check if notifications were already sent today
 */
const wasNotifiedToday = (): boolean => {
  const lastNotified = localStorage.getItem('lastNotificationDate');
  const today = getTodayLocal().toISOString().split('T')[0];
  return lastNotified === today;
};

const markNotifiedToday = (): void => {
  const today = getTodayLocal().toISOString().split('T')[0];
  localStorage.setItem('lastNotificationDate', today);
};

/**
 * Schedule local notifications for expiring members
 */
export const scheduleExpiryNotifications = async (teams: Team[]): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Skipping notifications on web platform');
    return;
  }

  // Skip if already notified today
  if (wasNotifiedToday()) {
    console.log('Already sent notifications today, skipping');
    return;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log('Notification permission denied');
    return;
  }

  // Cancel all previous scheduled notifications
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications });
  }

  const normalExpiring = findExpiringMembers(teams);
  const plusExpiring = findExpiringPlusMembers(teams);
  const allExpiring = [...normalExpiring, ...plusExpiring];

  if (allExpiring.length === 0) return;

  const notifications: ScheduleOptions = {
    notifications: allExpiring.map((item, index) => {
      const isPlus = item.team.isPlusTeam;
      const teamType = isPlus ? '🟣 Plus' : '🔵 Normal';
      const timeLabel = item.daysUntilExpiry === 1 ? 'আগামীকাল' : 'আজকে';
      const emoji = item.daysUntilExpiry === 0 ? '🔴' : '🟡';
      
      // Calculate expiry date
      const [y, m, d] = item.member.joinDate.split('-').map(Number);
      const joinDate = new Date(y, m - 1, d);
      const expiryDate = new Date(joinDate);
      expiryDate.setDate(expiryDate.getDate() + 30);
      const expiryStr = `${expiryDate.getDate()}/${expiryDate.getMonth() + 1}/${expiryDate.getFullYear()}`;
      const joinStr = `${joinDate.getDate()}/${joinDate.getMonth() + 1}/${joinDate.getFullYear()}`;

      const phone = item.member.phone ? `\n📞 ${item.member.phone}` : '';

      return {
        id: index + 1,
        title: `${emoji} সাবস্ক্রিপশন ${timeLabel} শেষ!`,
        body: `[${teamType}] ${item.team.teamName}\n📧 ${item.member.email}${phone}\n📅 জয়েন: ${joinStr} → শেষ: ${expiryStr}`,
        schedule: {
          at: new Date(Date.now() + 1000),
          allowWhileIdle: true,
        },
        sound: 'default',
        smallIcon: 'ic_notification',
        largeIcon: 'ic_notification',
        extra: {
          memberId: item.member.id,
          teamId: item.team.id,
          teamType: isPlus ? 'plus' : 'normal',
        },
      };
    }),
  };

  try {
    await LocalNotifications.schedule(notifications);
    markNotifiedToday();
    console.log(`Scheduled ${allExpiring.length} expiry notifications`);
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
};

/**
 * Schedule daily check notification (fires every day at 12:00 AM midnight)
 * This resets the notification flag and schedules expiry alerts
 */
export const scheduleDailyCheckNotification = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Schedule at midnight (12:00 AM) to reset and check
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 9999,
          title: '📋 Elite Notepade',
          body: 'আজকের মেম্বার আপডেট চেক করুন',
          schedule: {
            at: nextMidnight,
            every: 'day',
            allowWhileIdle: true,
          },
          sound: 'default',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_notification',
        },
      ],
    });
    console.log('Daily check notification scheduled for midnight');
  } catch (error) {
    console.error('Error scheduling daily notification:', error);
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
  await scheduleDailyCheckNotification();
};
