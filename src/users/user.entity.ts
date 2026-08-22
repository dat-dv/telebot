export interface UserUsage {
  usedToday: number;
  dailyLimit: number;
  lastRequestTime: number; // Timestamp for cooldown check
  lastResetDate: string; // YYYY-MM-DD
}

export interface UserProfile {
  id: number;
  username?: string;
  firstName?: string;
  role: 'admin' | 'user';
  createdAt: string;
  hasGoogleAuth?: boolean;
}

export interface InviteCode {
  code: string;
  createdBy: number;
  createdAt: string;
  expiresAt: string;
  usedBy?: number;
  usedAt?: string;
}

export interface UsersDatabase {
  users: Record<number, UserProfile>;
  invites: Record<string, InviteCode>;
  usage: Record<number, UserUsage>;
}
