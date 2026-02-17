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
 * Schedule local notifications for expiring members
 */
export const scheduleExpiryNotifications = async (teams: Team[]): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Skipping notifications on web platform');
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
      const teamLabel = item.team.isPlusTeam ? '[Plus]' : '';
      const timeLabel = item.daysUntilExpiry === 1 ? 'আগামীকাল' : 'আজকে';

      return {
        id: index + 1,
        title: `⚠️ সাবস্ক্রিপশন ${timeLabel} শেষ!`,
        body: `${teamLabel} ${item.team.teamName} - ${item.member.email} এর সাবস্ক্রিপশনের মেয়াদ ${timeLabel} শেষ হচ্ছে।`,
        schedule: {
          at: new Date(Date.now() + 1000), // Trigger almost immediately
          allowWhileIdle: true,
        },
        sound: 'default',
        smallIcon: 'ic_notification',
        largeIcon: 'ic_notification',
      };
    }),
  };

  try {
    await LocalNotifications.schedule(notifications);
    console.log(`Scheduled ${allExpiring.length} expiry notifications`);
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
};

/**
 * Schedule daily check notification (fires every day at 8 AM)
 * This sets up a repeating notification to remind the app to check
 */
export const scheduleDailyCheckNotification = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Schedule a daily notification at 8 AM
  const now = new Date();
  const next8AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
  if (now.getHours() >= 8) {
    next8AM.setDate(next8AM.getDate() + 1);
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 9999,
          title: '📋 Elite Notepade',
          body: 'আজকের মেম্বার আপডেট চেক করুন',
          schedule: {
            at: next8AM,
            every: 'day',
            allowWhileIdle: true,
          },
          sound: 'default',
          smallIcon: 'ic_notification',
          largeIcon: 'ic_notification',
        },
      ],
    });
    console.log('Daily check notification scheduled for 8 AM');
  } catch (error) {
    console.error('Error scheduling daily notification:', error);
  }
};

/**
 * Initialize the notification system
 */
export const initializeNotifications = async (teams: Team[]): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  // Listen for notification taps
  await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    console.log('Notification tapped:', notification);
    // Could navigate to specific team/member here
  });

  // Schedule notifications based on current data
  await scheduleExpiryNotifications(teams);
  await scheduleDailyCheckNotification();
};
