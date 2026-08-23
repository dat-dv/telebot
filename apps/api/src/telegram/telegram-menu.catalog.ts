export type TelegramMenuRole = 'member' | 'admin';

export interface TelegramMenuItem {
  readonly id: string;
  readonly command: string;
  readonly commandDescription: string;
  readonly label: string;
  readonly callbackData?: string;
  readonly opensDashboard?: boolean;
  readonly role?: TelegramMenuRole;
}

const PRIMARY_MENU_ITEMS: readonly TelegramMenuItem[] = [
  {
    id: 'dashboard',
    command: 'dashboard',
    commandDescription: 'Tổng quan công việc, lịch và tài chính',
    label: '📊 Dashboard',
    opensDashboard: true,
  },
  {
    id: 'today',
    command: 'today',
    commandDescription: 'Lịch trình và việc cần làm hôm nay',
    label: '📅 Lịch hôm nay',
    callbackData: 'action:refresh_today',
  },
  {
    id: 'tasks',
    command: 'tasks',
    commandDescription: 'Danh sách việc cần làm',
    label: '📝 Việc cần làm',
    callbackData: 'action:view_tasks',
  },
  {
    id: 'week',
    command: 'week',
    commandDescription: 'Tổng quan lịch 7 ngày tới',
    label: '📈 Lịch 7 ngày',
    callbackData: 'action:view_week',
  },
  {
    id: 'finance',
    command: 'finance',
    commandDescription: 'Thu chi trong hôm nay',
    label: '💰 Thu–chi',
    callbackData: 'action:view_finance',
  },
  {
    id: 'debts',
    command: 'debts',
    commandDescription: 'Các khoản công nợ đang mở',
    label: '💳 Công nợ đang mở',
    callbackData: 'action:view_debts',
  },
  {
    id: 'status',
    command: 'status',
    commandDescription: 'Trạng thái tài khoản và Google',
    label: '⚙️ Trạng thái',
    callbackData: 'action:refresh_status',
  },
];

const ADMIN_MENU_ITEMS: readonly TelegramMenuItem[] = [
  {
    id: 'users',
    command: 'users',
    commandDescription: 'Danh sách người dùng',
    label: '👥 Danh sách user',
    callbackData: 'action:refresh_users',
    role: 'admin',
  },
  {
    id: 'invite',
    command: 'invite',
    commandDescription: 'Tạo link mời người dùng',
    label: '🎟️ Tạo link mời',
    callbackData: 'action:create_invite',
    role: 'admin',
  },
];

const SYSTEM_COMMANDS: readonly TelegramMenuItem[] = [
  {
    id: 'help',
    command: 'help',
    commandDescription: 'Hướng dẫn sử dụng trợ lý',
    label: '💡 Hướng dẫn',
  },
  {
    id: 'start',
    command: 'start',
    commandDescription: 'Khởi động lại trợ lý',
    label: '🔄 Khởi động lại',
  },
];

export function getQuickMenuItems(isAdmin: boolean): readonly TelegramMenuItem[] {
  return isAdmin ? [...PRIMARY_MENU_ITEMS, ...ADMIN_MENU_ITEMS] : PRIMARY_MENU_ITEMS;
}

export function getTelegramCommands(isAdmin: boolean) {
  return [...getQuickMenuItems(isAdmin), ...SYSTEM_COMMANDS].map(
    ({ command, commandDescription }) => ({
      command,
      description: commandDescription,
    }),
  );
}
