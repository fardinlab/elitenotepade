export type SubscriptionType = 'chatgpt' | 'gemini' | 'perplexity' | 'youtube' | 'canva';

export const SUBSCRIPTION_CONFIG: Record<SubscriptionType, { name: string; color: string }> = {
  chatgpt: { name: 'ChatGPT', color: '#10A37F' },
  gemini: { name: 'Gemini AI', color: '#4285F4' },
  perplexity: { name: 'Perplexity', color: '#20808D' },
  youtube: { name: 'YouTube', color: '#FF0000' },
  canva: { name: 'Canva', color: '#00C4CC' },
};

export interface Member {
  id: string;
  email: string;
  phone: string;
  telegram?: string;
  twoFA?: string;
  password?: string;
  joinDate: string;
  isPaid?: boolean;
  paidAmount?: number;
  pendingAmount?: number;
  subscriptions?: SubscriptionType[];
  isPushed?: boolean;
  activeTeamId?: string;
  activeTeamName?: string;
}

export interface Team {
  id: string;
  teamName: string;
  adminEmail: string;
  members: Member[];
  createdAt: string;
  lastBackup?: string;
  logo?: SubscriptionType;
  isYearlyTeam?: boolean;
  isPlusTeam?: boolean;
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
