export const API_ROUTES = {
  access: '/api/access',
  dashboard: '/api/dashboard',
  dashboardRefresh: '/api/refresh',
  dashboardLogout: '/api/logout',
  contacts: '/api/contacts',
  debts: '/api/debts',
  expenses: '/api/expenses',
} as const;

export const APP_ROUTES = {
  home: '/',
  reports: '/reports',
  statistics: '/reports/statistics',
  contacts: '/reports/contacts',
  debts: '/reports/debts',
  expenses: '/reports/expenses',
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

export interface IDebtListItem {
  id: string;
  direction: 'receivable' | 'payable';
  counterparty: string;
  counterpartyAlias?: string;
  originalAmount: number;
  remainingAmount: number;
  note?: string;
  dueAt?: string;
  createdAt: string;
}

export interface IExpenseListItem {
  id: string;
  category: string;
  note: string;
  amount: number;
  occurredAt: string;
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

export interface IContactListResponse {
  contacts: IContactListItem[];
}
