export interface Member {
  id: string;
  email: string;
  phone: string;
  telegram?: string;
  joinDate: string;
}

export interface Team {
  id: string;
  teamName: string;
  adminEmail: string;
  members: Member[];
  createdAt: string;
  lastBackup?: string;
}

export interface Notepad {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  teams: Team[];
  activeTeamId: string;
  notepads?: Notepad[];
}

export const MAX_MEMBERS = 8;
