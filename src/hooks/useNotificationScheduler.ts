import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Team } from '@/types/member';
import { initializeNotifications, scheduleExpiryNotifications } from '@/services/notificationService';

/**
 * Hook to initialize and manage local notifications for member expiry alerts.
 * Only runs on native platforms (Android/iOS via Capacitor).
 */
export function useNotificationScheduler(teams: Team[], isLoaded: boolean) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!isLoaded || teams.length === 0) return;
    if (!Capacitor.isNativePlatform()) return;

    if (!initialized.current) {
      initialized.current = true;
      initializeNotifications(teams);
    } else {
      // Re-schedule when teams data changes
      scheduleExpiryNotifications(teams);
    }
  }, [teams, isLoaded]);
}
