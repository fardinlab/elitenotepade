export type SubscriptionType = 'chatgpt' | 'gemini' | 'perplexity' | 'canva';

export const SUBSCRIPTION_CONFIG: Record<SubscriptionType, { name: string; color: string }> = {
  chatgpt: { name: 'ChatGPT', color: '#10A37F' },
  gemini: { name: 'Gemini AI', color: '#4285F4' },
  perplexity: { name: 'Perplexity', color: '#20808D' },
  canva: { name: 'Canva', color: '#00C4CC' },
};

export interface Member {
  id: string;
  email: string;
  phone: string;
  telegram?: string;
  joinDate: string;
  isPaid?: boolean;
  paidAmount?: number;
  pendingAmount?: number;
  subscriptions?: SubscriptionType[];
}

export interface Team {
  id: string;
  teamName: string;
  adminEmail: string;
  members: Member[];
  createdAt: string;
  lastBackup?: string;
  logo?: SubscriptionType;
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
