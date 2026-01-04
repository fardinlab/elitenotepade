export interface Member {
  id: string;
  email: string;
  phone: string;
  joinDate: string;
}

export interface TeamData {
  teamName: string;
  adminEmail: string;
  members: Member[];
  lastBackup?: string;
}

export const MAX_MEMBERS = 8;
