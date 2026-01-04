import { useState, useEffect, useCallback } from 'react';
import { TeamData, Member, MAX_MEMBERS } from '@/types/member';

const STORAGE_KEY = 'elite_notepade_data';

const defaultData: TeamData = {
  teamName: 'My Elite Team',
  adminEmail: 'admin@example.com',
  members: [
    {
      id: '1',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      joinDate: new Date().toISOString().split('T')[0],
    },
  ],
};

export function useTeamData() {
  const [data, setData] = useState<TeamData>(defaultData);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData(defaultData);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const updateTeamName = useCallback((name: string) => {
    setData((prev) => ({ ...prev, teamName: name }));
  }, []);

  const updateAdminEmail = useCallback((email: string) => {
    setData((prev) => ({ ...prev, adminEmail: email }));
  }, []);

  const addMember = useCallback((member: Omit<Member, 'id'>) => {
    // +1 for admin
    if (data.members.length + 1 >= MAX_MEMBERS) {
      return false;
    }
    const newMember: Member = {
      ...member,
      id: Date.now().toString(),
    };
    setData((prev) => ({ ...prev, members: [...prev.members, newMember] }));
    return true;
  }, [data.members.length]);

  const removeMember = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== id),
    }));
  }, []);

  const updateMemberDate = useCallback((id: string, joinDate: string) => {
    setData((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === id ? { ...m, joinDate } : m
      ),
    }));
  }, []);

  const canAddMember = data.members.length + 1 < MAX_MEMBERS;

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
      if (parsed.teamName && parsed.adminEmail && Array.isArray(parsed.members)) {
        setData(parsed);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const setLastBackup = useCallback((date: string) => {
    setData((prev) => ({ ...prev, lastBackup: date }));
  }, []);

  return {
    data,
    isLoaded,
    updateTeamName,
    updateAdminEmail,
    addMember,
    removeMember,
    updateMemberDate,
    canAddMember,
    exportData,
    importData,
    setLastBackup,
    memberCount: data.members.length + 1, // +1 for admin
  };
}
