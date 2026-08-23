export const API_ROUTES = {
  access: '/api/access',
  dashboard: '/api/dashboard',
  dashboardRefresh: '/api/refresh',
  dashboardLogout: '/api/logout',
  contacts: '/api/contacts',
} as const;

export const APP_ROUTES = {
  home: '/',
  reports: '/reports',
  statistics: '/reports/statistics',
  contacts: '/reports/contacts',
} as const;

export interface IApiResponse<T> {
  data: T;
}

export interface IDashboardAccessTokenResponse {
  accessToken: string;
  expiresAt: string;
}

export interface IContactListItem {
  id: string;
  displayName: string;
  alias?: string;
  descriptor?: string;
  createdAt: string;
}

export interface IDashboardData {
  user: { name: string; isAdmin: boolean; googleConnected: boolean };
  finance: {
    income: number;
    expense: number;
    balance: number;
    receivable: number;
    payable: number;
  };
  transactions: Array<{
    id: string;
    type: 'income' | 'expense';
    category: string;
    note: string;
    amount: number;
    occurredAt: string;
  }>;
  debts: Array<{
    id: string;
    direction: 'receivable' | 'payable';
    counterparty: string;
    remainingAmount: number;
    dueAt?: string;
  }>;
  calendar: Array<{ id: string; title: string; startAt?: string }>;
  tasks: Array<{ id: string; title: string; dueAt?: string }>;
  reminders: Array<{ id: string; title: string; remindAt: string; notifyType: 'text' | 'call' }>;
  activity: Array<{ id: string; action: string; tableName: string; createdAt: string }>;
  admin?: { userCount: number; googleConnectedCount: number };
}

export interface IContactListItem {
  id: string;
  displayName: string;
  alias?: string;
  descriptor?: string;
  createdAt: string;
}

export interface IContactListResponse {
  contacts: IContactListItem[];
}
