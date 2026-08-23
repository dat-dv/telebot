export type TelegramMenuRole = 'member' | 'admin';
import { translate, type SupportedLocale } from '@telebot/contracts';

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
    label: '📊 Tổng quan',
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
    label: '💰 Thu chi',
    callbackData: 'action:view_finance',
  },
  {
    id: 'debts',
    command: 'debts',
    commandDescription: 'Các khoản cho vay và đi vay đang mở',
    label: '💳 Vay & cho vay',
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
    id: 'language',
    command: 'language',
    commandDescription: 'Chọn ngôn ngữ hiển thị',
    label: '🌐 Ngôn ngữ',
  },
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

export function getQuickMenuItems(
  isAdmin: boolean,
  _locale: SupportedLocale = 'vi',
): readonly TelegramMenuItem[] {
  return isAdmin ? [...PRIMARY_MENU_ITEMS, ...ADMIN_MENU_ITEMS] : PRIMARY_MENU_ITEMS;
}

export function getTelegramCommands(isAdmin: boolean, locale: SupportedLocale = 'vi') {
  const localizedSystemCommands = SYSTEM_COMMANDS.map((item) =>
    item.id === 'language'
      ? { ...item, commandDescription: translate(locale, 'common.language') }
      : item,
  );
  return [...getQuickMenuItems(isAdmin, locale), ...localizedSystemCommands].map(
    ({ command, commandDescription }) => ({
      command,
      description: commandDescription,
    }),
  );
}
