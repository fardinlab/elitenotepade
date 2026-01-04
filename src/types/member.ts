export interface Member {
  id: string;
  email: string;
  phone: string;
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

export interface AppData {
  teams: Team[];
  activeTeamId: string;
}

export const MAX_MEMBERS = 8;
