export const API_ROUTES = {
  access: '/api/access',
  dashboard: '/api/dashboard',
  dashboardRefresh: '/api/refresh',
  dashboardLogout: '/api/logout',
  contacts: '/api/contacts',
  debts: '/api/debts',
  expenses: '/api/expenses',
  transactions: '/api/transactions',
  reminders: '/api/reminders',
  users: '/api/users',
  invites: '/api/invites',
  calendarEvents: '/api/calendar/events',
  tasks: '/api/tasks',
} as const;

export const APP_ROUTES = {
  home: '/',
  reports: '/reports',
  statistics: '/reports/statistics',
  contacts: '/reports/contacts',
  debts: '/reports/debts',
  expenses: '/reports/expenses',
} as const;

export const SUPPORTED_LOCALES = ['vi', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'vi';

export function normalizeLocale(value: unknown): SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as SupportedLocale)
    : DEFAULT_LOCALE;
}

export function localeTag(locale: SupportedLocale): 'vi-VN' | 'en-US' {
  return locale === 'en' ? 'en-US' : 'vi-VN';
}

type TranslationValues = Record<string, string | number>;
const messages = {
  vi: {
    'common.refresh': 'Làm mới',
    'common.retry': 'Thử lại',
    'common.logout': 'Đăng xuất',
    'common.close': 'Đóng',
    'common.confirm': 'Xác nhận',
    'common.cancel': 'Hủy',
    'common.language': 'Ngôn ngữ',
    'common.loadingDashboard': 'Đang tải dashboard',
    'nav.home': 'Trang chủ',
    'nav.statistics': 'Thống kê',
    'nav.contacts': 'Liên lạc',
    'nav.debts': 'Công nợ',
    'nav.expenses': 'Khoản chi',
    'nav.reports': 'Báo cáo',
    'nav.personalSpace': 'Không gian cá nhân',
    'nav.dark': 'Giao diện tối',
    'nav.light': 'Giao diện sáng',
    'web.language.vi': 'Tiếng Việt',
    'web.language.en': 'English',
    'reminder.header.text': '⏰ *TING TING! LỜI NHẮC CỦA BẠN ĐÃ ĐẾN GIỜ!*',
    'reminder.header.call': '📞 *CUỘC GỌI NHẮC NHỞ TỰ ĐỘNG (CALLME)!*',
    'reminder.done': '✅ Đã xong',
    'reminder.snooze': '⏳ Nhắc lại 15 phút',
    'telegram.language.updated': '✅ Đã đổi ngôn ngữ sang Tiếng Việt.',
    'telegram.language.choose': 'Chọn ngôn ngữ hiển thị:',
  },
  en: {
    'common.refresh': 'Refresh',
    'common.retry': 'Try again',
    'common.logout': 'Log out',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.language': 'Language',
    'common.loadingDashboard': 'Loading dashboard',
    'nav.home': 'Home',
    'nav.statistics': 'Statistics',
    'nav.contacts': 'Contacts',
    'nav.debts': 'Debts',
    'nav.expenses': 'Expenses',
    'nav.reports': 'Reports',
    'nav.personalSpace': 'Personal space',
    'nav.dark': 'Dark mode',
    'nav.light': 'Light mode',
    'web.language.vi': 'Tiếng Việt',
    'web.language.en': 'English',
    'reminder.header.text': '⏰ *REMINDER: IT IS TIME!*',
    'reminder.header.call': '📞 *AUTOMATED REMINDER CALL (CALLME)!*',
    'reminder.done': '✅ Done',
    'reminder.snooze': '⏳ Remind me in 15 minutes',
    'telegram.language.updated': '✅ Language changed to English.',
    'telegram.language.choose': 'Choose your display language:',
  },
} as const;

export type TranslationKey = keyof (typeof messages)['vi'];
export function translate(
  locale: SupportedLocale,
  key: TranslationKey,
  values: TranslationValues = {},
): string {
  let text: string = messages[locale][key] ?? messages[DEFAULT_LOCALE][key];
  for (const [name, value] of Object.entries(values))
    text = text.replaceAll(`{${name}}`, String(value));
  return text;
}

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

export type TransactionType = 'income' | 'expense';
export type DebtDirection = 'receivable' | 'payable';
export type ReminderNotifyType = 'text' | 'call';
export type ReminderRepeatType = 'none' | 'daily' | 'weekly';

export interface ICreateTransactionRequest {
  type: TransactionType;
  amount: number;
  note: string;
  category?: string;
  occurredAt?: string;
}

export interface ICreateReminderRequest {
  title: string;
  remindAt: string;
  notifyType?: ReminderNotifyType;
  repeatType?: ReminderRepeatType;
}
