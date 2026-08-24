export const API_ROUTES = {
  access: '/api/access',
  dashboard: '/api/dashboard',
  dashboardRefresh: '/api/refresh',
  dashboardLogout: '/api/logout',
  contacts: '/api/contacts',
  contactsCombine: '/api/contacts/combine',
  debts: '/api/debts',
  debtPayments: '/api/debts/payments',
  expenses: '/api/expenses',
  transactions: '/api/transactions',
  reminders: '/api/reminders',
  users: '/api/users',
  invites: '/api/invites',
  calendarEvents: '/api/calendar/events',
  tasks: '/api/tasks',
  googleAuthCallback: '/api/oauth2callback',
  swaggerDocs: '/api/docs',
} as const;

export const APP_ROUTES = {
  home: '/',

  transactions: '/transactions',
  expenses: '/expenses',
  income: '/income',

  debts: '/debts',

  analytics: '/analytics',
  analyticsSpending: '/analytics/spending',
  analyticsCashflow: '/analytics/cashflow',
  analyticsDebts: '/analytics/debts',

  calendar: '/calendar',
  tasks: '/tasks',
  reminders: '/reminders',

  contacts: '/contacts',
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
    'common.loadingDashboard': 'Đang tải dữ liệu',
    'common.notSet': 'Chưa đặt',
    'common.allCategories': 'Tất cả danh mục',
    'nav.home': 'Tổng quan',
    'nav.statistics': 'Phân tích',
    'nav.contacts': 'Người liên quan',
    'nav.debts': 'Vay & cho vay',
    'nav.expenses': 'Chi tiêu',
    'nav.income': 'Thu nhập',
    'nav.transactions': 'Thu chi',
    'nav.analytics': 'Phân tích',
    'nav.calendar': 'Lịch',
    'nav.tasks': 'Việc cần làm',
    'nav.reminders': 'Nhắc nhở',
    'nav.reports': 'Tài chính',
    'nav.personalSpace': 'Cá nhân',
    'nav.section.overview': 'TỔNG QUAN',
    'nav.section.finance': 'TÀI CHÍNH',
    'nav.section.planning': 'KẾ HOẠCH',
    'nav.section.data': 'DỮ LIỆU',
    'nav.section.other': 'KHÁC',
    'nav.dark': 'Giao diện tối',
    'nav.light': 'Giao diện sáng',
    'nav.menu': 'Menu điều hướng',
    'nav.openMenu': 'Mở menu điều hướng',
    'nav.closeMenu': 'Đóng menu điều hướng',
    'web.language.vi': 'Tiếng Việt',
    'web.language.en': 'English',
    'reminder.header.text': '⏰ *TING TING! LỜI NHẮC CỦA BẠN ĐÃ ĐẾN GIỜ!*',
    'reminder.header.call': '📞 *CUỘC GỌI NHẮC NHỞ TỰ ĐỘNG (CALLME)!*',
    'reminder.done': '✅ Đã xong',
    'reminder.snooze': '⏳ Nhắc lại 15 phút',
    'telegram.language.updated': '✅ Đã đổi ngôn ngữ sang Tiếng Việt.',
    'telegram.language.choose': 'Chọn ngôn ngữ hiển thị:',
    'telegram.reminders.empty': '⏰ Hiện bạn không có lời nhắc nào sắp tới.',
    'telegram.reminders.fetchError': '⚠️ Không thể lấy danh sách lời nhắc: {error}',
    'telegram.reminders.cancelButton': '🗑️ Hủy #{index}',
    'telegram.reminders.refresh': '🔄 Làm mới',
    'telegram.reminders.close': '❌ Đóng',
    'table.searchPlaceholder': 'Tìm kiếm nhanh...',
    'table.filter.all': 'Tất cả',
    'table.filter.receivable': 'Cho vay',
    'table.filter.payable': 'Đi vay',
    'table.filter.income': 'Thu',
    'table.filter.expense': 'Chi',
    'table.rowsCount': '{count} dòng',
    'table.total': 'Tổng: {total}',
    'table.columnSettings': 'Cài đặt cột',
    'table.columnVisibility': 'Ẩn/hiện cột',
    'table.showAllColumns': 'Hiện tất cả',
    'table.resetColumns': 'Đặt lại mặc định',
    'table.columnsCount': '{visible}/{total} cột',
    'table.scrollHint': 'Cuộn ngang để xem thêm',
    'table.columnRequired': 'Bắt buộc',
    'table.columnsHiddenBadge': '{count} ẩn',
    'dashboard.quickStats': 'Tổng quan tài chính',
    'dashboard.welcome': 'Xin chào',
    'dashboard.overviewSubtitle': 'Tài chính, công việc và lịch trình của bạn',
    'dashboard.statisticsSubtitle': 'Tổng quan tháng này',
    'dashboard.attentionItems': 'Cần chú ý',
    'dashboard.thisMonthBalance': 'Chênh lệch thu chi',
    'dashboard.receivableTotal': 'Người khác nợ bạn',
    'dashboard.payableTotal': 'Bạn đang nợ',
    'dashboard.incomeTotal': 'Tổng thu',
    'dashboard.expenseTotal': 'Tổng chi',
    'dashboard.netDebt': 'Chênh lệch vay nợ',
    'dashboard.balance': 'Thu − Chi',
    'dashboard.tasks': 'Việc cần làm',
    'dashboard.reminders': 'Nhắc nhở',
    'dashboard.calendar': 'Lịch sắp tới',
    'dashboard.activity': 'Hoạt động gần đây',
    'dashboard.transactions': 'Thu chi gần đây',
    'dashboard.openDebts': 'Vay & cho vay',
    'dashboard.admin': 'Quản trị',
    'dashboard.usersCount': '{count} người dùng',
    'dashboard.googleConnectedCount': '{count} đã kết nối Google',
    'dashboard.connectGoogleTip': 'Kết nối Google từ bot để xem dữ liệu',
    'dashboard.noTasks': 'Chưa có việc cần làm',
    'dashboard.noReminders': 'Chưa có nhắc nhở',
    'dashboard.noCalendar': 'Chưa có lịch sắp tới',
    'dashboard.noActivity': 'Chưa có hoạt động',
    'dashboard.noTransactions': 'Chưa có giao dịch',
    'dashboard.noDebts': 'Không có khoản vay nợ',
    'dashboard.noExpenses': 'Chưa có chi tiêu',
    'dashboard.noContacts': 'Chưa có người liên quan nào',
    'dashboard.columns.transaction': 'Nội dung',
    'dashboard.columns.note': 'Ghi chú',
    'dashboard.columns.amount': 'Số tiền',
    'dashboard.columns.counterparty': 'Người liên quan',
    'dashboard.columns.dueDate': 'Ngày hẹn trả',
    'dashboard.columns.remaining': 'Còn lại',
    'dashboard.columns.original': 'Ban đầu',
    'dashboard.columns.direction': 'Loại',
    'dashboard.columns.category': 'Danh mục',
    'dashboard.columns.date': 'Thời gian',
    'dashboard.columns.name': 'Tên',
    'dashboard.columns.alias': 'Tên gọi',
    'dashboard.columns.descriptor': 'Ghi chú',
    'dashboard.columns.title': 'Nội dung',
    'dashboard.columns.action': 'Hoạt động',
    'dashboard.columns.schedule': 'Thời gian',
    'dashboard.error.title': 'Không mở được trang',
    'dashboard.error.desc': 'Phiên làm việc đã hết hạn. Hãy mở lại từ Telegram bot.',
    'debts.title': 'Vay & cho vay',
    'debts.subtitle': 'Theo dõi tiền bạn cho mượn và tiền bạn đang vay',
    'expenses.title': 'Chi tiêu',
    'expenses.subtitle': 'Ăn uống, đi lại, mua sắm và các khoản chi khác',
    'contacts.title': 'Người liên quan',
    'contacts.subtitle': 'Những người có giao dịch vay, cho vay hoặc thu chi với bạn',
    'contacts.actions.edit': 'Sửa',
    'contacts.actions.save': 'Lưu',
    'contacts.actions.cancel': 'Hủy',
    'contacts.actions.combine': 'Gộp liên hệ ({count})',
    'contacts.combineModal.title': 'Gộp liên hệ / Địa chỉ quán',
    'contacts.combineModal.desc': 'Chọn liên hệ chính và điều chỉnh thông tin gộp.',
    'contacts.combineModal.targetLabel': 'Liên hệ chính (giữ lại)',
    'contacts.combineModal.mergedName': 'Tên sau khi gộp',
    'contacts.combineModal.mergedAlias': 'Tên gọi / Biệt danh sau khi gộp',
    'contacts.combineModal.mergedDescriptor': 'Địa chỉ quán / Ghi chú sau khi gộp',
    'contacts.combineModal.warning':
      'Toàn bộ khoản nợ liên quan sẽ được chuyển sang liên hệ chính. Hành động này không thể hoàn tác.',
    'contacts.combineModal.confirm': 'Xác nhận gộp',
    'contacts.inlineEdit.saved': 'Đã lưu thay đổi',
    'contacts.combine.success': 'Đã gộp thành công {count} liên hệ',
    'contacts.placeholder.descriptor': 'Nhập địa chỉ quán, ghi chú...',
    'contacts.placeholder.name': 'Tên liên hệ / Quán',
    'contacts.placeholder.alias': 'Tên gọi / Biệt danh',
    'contacts.placeholder.phone': 'Nhập số điện thoại...',
    'contacts.placeholder.bankAccount': 'Nhập số tài khoản...',
    'contacts.placeholder.bankName': 'Tên ngân hàng / Mã (VD: VCB, MB)...',
    'contacts.columns.phone': 'Số điện thoại',
    'contacts.columns.bankAccount': 'Tài khoản ngân hàng',
    'contacts.columns.bankName': 'Ngân hàng',
    'debts.columns.status': 'Trạng thái',
    'debts.columns.settledAt': 'Ngày tất toán',
    'debts.columns.currency': 'Tiền tệ',
    'debts.status.active': 'Đang mở',
    'debts.status.settled': 'Đã tất toán',
    'debts.filter.statusAll': 'Tất cả trạng thái',
    'debts.filter.statusActive': 'Đang mở',
    'debts.filter.statusSettled': 'Đã tất toán',
    'debts.filter.directionAll': 'Tất cả luồng',
    'debts.history.title': 'Lịch sử trả nợ',
    'debts.history.paidAmount': 'Đã trả',
    'debts.history.paymentDate': 'Ngày trả',
    'expenses.columns.paymentMethod': 'Nguồn tiền',
    'expenses.columns.currency': 'Tiền tệ',
    'expenses.actions.edit': 'Sửa',
    'expenses.actions.save': 'Lưu',
    'expenses.actions.cancel': 'Hủy',
    'expenses.actions.delete': 'Xóa',
    'expenses.inlineEdit.saved': 'Đã cập nhật chi tiêu',
    'expenses.delete.confirm': 'Bạn có chắc chắn muốn xóa khoản chi tiêu này không?',
    'expenses.delete.success': 'Đã xóa khoản chi tiêu',
    'expenses.placeholder.category': 'Nhập danh mục...',
    'expenses.placeholder.note': 'Nhập ghi chú chi tiêu...',
    'expenses.placeholder.amount': 'Nhập số tiền...',
    'expenses.placeholder.paymentMethod': 'Nguồn tiền...',
    'debts.actions.edit': 'Sửa',
    'debts.actions.save': 'Lưu',
    'debts.actions.cancel': 'Hủy',
    'debts.actions.repay': 'Trả nợ',
    'debts.inlineEdit.saved': 'Đã cập nhật khoản vay nợ',
    'debts.placeholder.counterparty': 'Nhập hoặc chọn người liên quan...',
    'debts.placeholder.originalAmount': 'Số tiền ban đầu...',
    'debts.placeholder.remainingAmount': 'Số tiền còn lại...',
    'debts.placeholder.note': 'Nhập ghi chú...',
    'debts.placeholder.due': 'Hạn chót...',
    'contacts.selectedCount': 'Đã chọn {count}',
    'contacts.selectAll': 'Chọn tất cả',
    'contacts.deselectAll': 'Bỏ chọn',
    'transactions.title': 'Thu chi',
    'transactions.subtitle': 'Lịch sử dòng tiền và các giao dịch thu chi',
    'transactions.actions.edit': 'Sửa',
    'transactions.actions.save': 'Lưu',
    'transactions.actions.cancel': 'Hủy',
    'transactions.actions.delete': 'Xóa',
    'transactions.delete.confirm': 'Bạn có chắc chắn muốn xóa giao dịch này không?',
    'transactions.delete.success': 'Đã xóa giao dịch',
    'transactions.inlineEdit.saved': 'Đã cập nhật giao dịch',
    'transactions.placeholder.category': 'Nhập danh mục...',
    'transactions.placeholder.note': 'Nhập ghi chú...',
    'transactions.placeholder.amount': 'Nhập số tiền...',
    'analytics.title': 'Phân tích',
    'analytics.subtitle': 'Tổng quan xu hướng tài chính và phân bổ chi tiêu',
    'calendar.title': 'Lịch',
    'calendar.subtitle': 'Lịch trình sự kiện 7 ngày tới',
    'calendar.columns.description': 'Mô tả',
    'calendar.columns.location': 'Địa điểm',
    'calendar.columns.endAt': 'Kết thúc',
    'calendar.actions.edit': 'Sửa',
    'calendar.actions.save': 'Lưu',
    'calendar.actions.cancel': 'Hủy',
    'calendar.actions.delete': 'Xóa',
    'calendar.inlineEdit.saved': 'Đã cập nhật sự kiện',
    'calendar.delete.confirm': 'Bạn có chắc chắn muốn xóa sự kiện này không?',
    'calendar.delete.success': 'Đã xóa sự kiện',
    'calendar.placeholder.title': 'Nhập tiêu đề sự kiện...',
    'calendar.placeholder.location': 'Nhập địa điểm...',
    'calendar.placeholder.description': 'Nhập mô tả chi tiết...',
    'tasks.title': 'Việc cần làm',
    'tasks.subtitle': 'Danh sách công việc từ Google Tasks',
    'tasks.columns.status': 'Trạng thái',
    'tasks.columns.notes': 'Ghi chú',
    'tasks.columns.updatedAt': 'Cập nhật',
    'tasks.status.needsAction': 'Cần làm',
    'tasks.status.completed': 'Đã xong',
    'tasks.placeholder.title': 'Nhập tiêu đề công việc...',
    'tasks.placeholder.notes': 'Nhập ghi chú...',
    'tasks.placeholder.due': 'Hạn chót...',
    'tasks.actions.edit': 'Sửa',
    'tasks.actions.save': 'Lưu',
    'tasks.actions.cancel': 'Hủy',
    'tasks.actions.delete': 'Xóa',
    'tasks.actions.complete': 'Hoàn thành',
    'tasks.inlineEdit.saved': 'Đã cập nhật công việc',
    'tasks.delete.confirm': 'Bạn có chắc chắn muốn xóa công việc này không?',
    'tasks.delete.success': 'Đã xóa công việc',
    'tasks.filter.all': 'Tất cả',
    'tasks.filter.needsAction': 'Cần làm',
    'tasks.filter.completed': 'Đã xong',
    'tasks.stats.total': 'Tổng số việc',
    'tasks.stats.pending': 'Cần làm',
    'tasks.stats.completed': 'Đã xong',
    'tasks.stats.overdue': 'Quá hạn',
    'reminders.title': 'Nhắc nhở',
    'reminders.subtitle': 'Danh sách lời nhắc tự động qua Telegram & Gọi điện',
    'reminders.columns.notifyType': 'Hình thức',
    'reminders.columns.repeatType': 'Lặp lại',
    'reminders.actions.edit': 'Sửa',
    'reminders.actions.save': 'Lưu',
    'reminders.actions.cancel': 'Hủy',
    'reminders.actions.delete': 'Xóa',
    'reminders.actions.snooze': 'Hoãn 15p',
    'reminders.inlineEdit.saved': 'Đã cập nhật lời nhắc',
    'reminders.delete.confirm': 'Bạn có chắc chắn muốn xóa lời nhắc này không?',
    'reminders.delete.success': 'Đã xóa lời nhắc',
    'reminders.snooze.success': 'Đã hoãn lời nhắc thêm 15 phút',
    'reminders.notifyType.call': 'Gọi điện',
    'reminders.notifyType.text': 'Nhắn tin',
    'reminders.repeatType.none': 'Không lặp',
    'reminders.repeatType.daily': 'Hàng ngày',
    'reminders.repeatType.weekly': 'Hàng tuần',
    'reminders.placeholder.title': 'Nhập tiêu đề lời nhắc...',
    'period.day': 'Ngày',
    'period.week': 'Tuần',
    'period.month': 'Tháng',
    'period.quarter': 'Quý',
    'period.year': 'Năm',
    'period.all': 'Tất cả',
    'period.prev': 'Kỳ trước',
    'period.next': 'Kỳ sau',
    'period.label.day': 'Ngày {date}',
    'period.label.week': 'Tuần {week} ({range})',
    'period.label.month': 'Tháng {month}/{year}',
    'period.label.quarter': 'Quý {quarter}/{year}',
    'period.label.year': 'Năm {year}',
    'period.label.all': 'Tất cả thời gian',
    'chart.toggleShow': 'Hiện biểu đồ',
    'chart.toggleHide': 'Ẩn biểu đồ',
    'chart.incomeVsExpense': 'Xu hướng Thu vs Chi',
    'chart.cashflow': 'Dòng tiền ròng',
    'chart.noData': 'Chưa có dữ liệu xu hướng',
    'chart.income': 'Thu nhập',
    'chart.expense': 'Chi tiêu',
    'chart.net': 'Dòng tiền',
  },
  en: {
    'common.refresh': 'Refresh',
    'common.retry': 'Try again',
    'common.logout': 'Log out',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.language': 'Language',
    'common.loadingDashboard': 'Loading data',
    'common.notSet': 'Not set',
    'common.allCategories': 'All categories',
    'nav.home': 'Overview',
    'nav.statistics': 'Analytics',
    'nav.contacts': 'People',
    'nav.debts': 'Loans & Debts',
    'nav.expenses': 'Expenses',
    'nav.income': 'Income',
    'nav.transactions': 'Transactions',
    'nav.analytics': 'Analytics',
    'nav.calendar': 'Calendar',
    'nav.tasks': 'Tasks',
    'nav.reminders': 'Reminders',
    'nav.reports': 'Finance',
    'nav.personalSpace': 'Personal',
    'nav.section.overview': 'OVERVIEW',
    'nav.section.finance': 'FINANCE',
    'nav.section.planning': 'PLANNING',
    'nav.section.data': 'DATA',
    'nav.section.other': 'OTHER',
    'nav.dark': 'Dark mode',
    'nav.light': 'Light mode',
    'nav.menu': 'Navigation menu',
    'nav.openMenu': 'Open navigation menu',
    'nav.closeMenu': 'Close navigation menu',
    'web.language.vi': 'Tiếng Việt',
    'web.language.en': 'English',
    'reminder.header.text': '⏰ *REMINDER: IT IS TIME!*',
    'reminder.header.call': '📞 *AUTOMATED REMINDER CALL (CALLME)!*',
    'reminder.done': '✅ Done',
    'reminder.snooze': '⏳ Remind me in 15 minutes',
    'telegram.language.updated': '✅ Language changed to English.',
    'telegram.language.choose': 'Choose your display language:',
    'telegram.reminders.empty': '⏰ You have no upcoming reminders.',
    'telegram.reminders.fetchError': '⚠️ Unable to fetch reminders: {error}',
    'telegram.reminders.cancelButton': '🗑️ Cancel #{index}',
    'telegram.reminders.refresh': '🔄 Refresh',
    'telegram.reminders.close': '❌ Close',
    'table.searchPlaceholder': 'Quick search...',
    'table.filter.all': 'All',
    'table.filter.receivable': 'Lent',
    'table.filter.payable': 'Borrowed',
    'table.filter.income': 'Income',
    'table.filter.expense': 'Expense',
    'table.rowsCount': '{count} rows',
    'table.total': 'Total: {total}',
    'table.columnSettings': 'Column settings',
    'table.columnVisibility': 'Toggle columns',
    'table.showAllColumns': 'Show all',
    'table.resetColumns': 'Reset to default',
    'table.columnsCount': '{visible}/{total} cols',
    'table.scrollHint': 'Scroll horizontally to view more',
    'table.columnRequired': 'Required',
    'table.columnsHiddenBadge': '{count} hidden',
    'dashboard.quickStats': 'Financial overview',
    'dashboard.welcome': 'Welcome',
    'dashboard.overviewSubtitle': 'Your finances, tasks, and schedule',
    'dashboard.statisticsSubtitle': 'Current month overview',
    'dashboard.attentionItems': 'Attention needed',
    'dashboard.thisMonthBalance': 'Net income/expense',
    'dashboard.receivableTotal': 'Others owe you',
    'dashboard.payableTotal': 'You owe',
    'dashboard.incomeTotal': 'Total income',
    'dashboard.expenseTotal': 'Total expense',
    'dashboard.netDebt': 'Net loan balance',
    'dashboard.balance': 'Income − Expense',
    'dashboard.tasks': 'Tasks',
    'dashboard.reminders': 'Reminders',
    'dashboard.calendar': 'Upcoming events',
    'dashboard.activity': 'Recent activity',
    'dashboard.transactions': 'Recent transactions',
    'dashboard.openDebts': 'Loans & debts',
    'dashboard.admin': 'Administration',
    'dashboard.usersCount': '{count} users',
    'dashboard.googleConnectedCount': '{count} Google connected',
    'dashboard.connectGoogleTip': 'Connect Google from bot to view data',
    'dashboard.noTasks': 'No pending tasks',
    'dashboard.noReminders': 'No reminders',
    'dashboard.noCalendar': 'No upcoming events',
    'dashboard.noActivity': 'No recent activity',
    'dashboard.noTransactions': 'No transactions',
    'dashboard.noDebts': 'No open loans or debts',
    'dashboard.noExpenses': 'No expenses found',
    'dashboard.noContacts': 'No related people found',
    'dashboard.columns.transaction': 'Transaction',
    'dashboard.columns.note': 'Note',
    'dashboard.columns.amount': 'Amount',
    'dashboard.columns.counterparty': 'Person',
    'dashboard.columns.dueDate': 'Due date',
    'dashboard.columns.remaining': 'Remaining',
    'dashboard.columns.original': 'Original',
    'dashboard.columns.direction': 'Type',
    'dashboard.columns.category': 'Category',
    'dashboard.columns.date': 'Time',
    'dashboard.columns.name': 'Name',
    'dashboard.columns.alias': 'Alias',
    'dashboard.columns.descriptor': 'Note',
    'dashboard.columns.title': 'Title',
    'dashboard.columns.action': 'Action',
    'dashboard.columns.schedule': 'Schedule',
    'dashboard.error.title': 'Unable to load page',
    'dashboard.error.desc': 'Session expired. Please open again from the Telegram bot.',
    'debts.title': 'Loans & Debts',
    'debts.subtitle': 'Track money you lent and money you owe',
    'expenses.title': 'Expenses',
    'expenses.subtitle': 'Daily spending, shopping, dining and other expenses',
    'contacts.title': 'People',
    'contacts.subtitle': 'People with loan or spending transactions with you',
    'contacts.actions.edit': 'Edit',
    'contacts.actions.save': 'Save',
    'contacts.actions.cancel': 'Cancel',
    'contacts.actions.combine': 'Combine ({count})',
    'contacts.combineModal.title': 'Combine Contacts / Places',
    'contacts.combineModal.desc': 'Select primary contact and adjust merged details.',
    'contacts.combineModal.targetLabel': 'Primary contact (keep)',
    'contacts.combineModal.mergedName': 'Merged display name',
    'contacts.combineModal.mergedAlias': 'Merged alias',
    'contacts.combineModal.mergedDescriptor': 'Merged address / note',
    'contacts.combineModal.warning':
      'All related debts will be migrated to the primary contact. This action cannot be undone.',
    'contacts.combineModal.confirm': 'Confirm Combine',
    'contacts.inlineEdit.saved': 'Changes saved',
    'contacts.combine.success': 'Successfully combined {count} contacts',
    'contacts.placeholder.descriptor': 'Enter address, note...',
    'contacts.placeholder.name': 'Contact / Place name',
    'contacts.placeholder.alias': 'Alias / Short name',
    'contacts.placeholder.phone': 'Enter phone number...',
    'contacts.placeholder.bankAccount': 'Enter bank account number...',
    'contacts.placeholder.bankName': 'Bank name / Code (e.g. VCB, MB)...',
    'contacts.columns.phone': 'Phone number',
    'contacts.columns.bankAccount': 'Bank account',
    'contacts.columns.bankName': 'Bank name',
    'debts.columns.status': 'Status',
    'debts.columns.settledAt': 'Settled date',
    'debts.columns.currency': 'Currency',
    'debts.status.active': 'Active',
    'debts.status.settled': 'Settled',
    'debts.filter.statusAll': 'All status',
    'debts.filter.statusActive': 'Active',
    'debts.filter.statusSettled': 'Settled',
    'debts.filter.directionAll': 'All directions',
    'debts.history.title': 'Repayment history',
    'debts.history.paidAmount': 'Paid amount',
    'debts.history.paymentDate': 'Payment date',
    'expenses.columns.paymentMethod': 'Payment method',
    'expenses.columns.currency': 'Currency',
    'expenses.actions.edit': 'Edit',
    'expenses.actions.save': 'Save',
    'expenses.actions.cancel': 'Cancel',
    'expenses.actions.delete': 'Delete',
    'expenses.inlineEdit.saved': 'Expense updated successfully',
    'expenses.delete.confirm': 'Are you sure you want to delete this expense?',
    'expenses.delete.success': 'Expense deleted successfully',
    'expenses.placeholder.category': 'Category...',
    'expenses.placeholder.note': 'Expense note...',
    'expenses.placeholder.amount': 'Amount...',
    'expenses.placeholder.paymentMethod': 'Payment method...',
    'debts.actions.edit': 'Edit',
    'debts.actions.save': 'Save',
    'debts.actions.cancel': 'Cancel',
    'debts.actions.repay': 'Repay',
    'debts.inlineEdit.saved': 'Debt updated successfully',
    'debts.placeholder.counterparty': 'Enter or select person...',
    'debts.placeholder.originalAmount': 'Original amount...',
    'debts.placeholder.remainingAmount': 'Remaining amount...',
    'debts.placeholder.note': 'Debt note...',
    'debts.placeholder.due': 'Due date...',
    'contacts.selectedCount': '{count} selected',
    'contacts.selectAll': 'Select all',
    'contacts.deselectAll': 'Deselect all',
    'transactions.title': 'Transactions',
    'transactions.subtitle': 'Cash flow and transaction history',
    'transactions.actions.edit': 'Edit',
    'transactions.actions.save': 'Save',
    'transactions.actions.cancel': 'Cancel',
    'transactions.actions.delete': 'Delete',
    'transactions.delete.confirm': 'Are you sure you want to delete this transaction?',
    'transactions.delete.success': 'Transaction deleted successfully',
    'transactions.inlineEdit.saved': 'Transaction updated successfully',
    'transactions.placeholder.category': 'Enter category...',
    'transactions.placeholder.note': 'Enter note...',
    'transactions.placeholder.amount': 'Enter amount...',
    'analytics.title': 'Analytics',
    'analytics.subtitle': 'Financial trends and spending breakdown',
    'calendar.title': 'Calendar',
    'calendar.subtitle': 'Upcoming 7-day schedule and events',
    'calendar.columns.description': 'Description',
    'calendar.columns.location': 'Location',
    'calendar.columns.endAt': 'End time',
    'calendar.actions.edit': 'Edit',
    'calendar.actions.save': 'Save',
    'calendar.actions.cancel': 'Cancel',
    'calendar.actions.delete': 'Delete',
    'calendar.inlineEdit.saved': 'Event updated successfully',
    'calendar.delete.confirm': 'Are you sure you want to delete this event?',
    'calendar.delete.success': 'Event deleted successfully',
    'calendar.placeholder.title': 'Event title...',
    'calendar.placeholder.location': 'Location...',
    'calendar.placeholder.description': 'Event description...',
    'tasks.title': 'Tasks',
    'tasks.subtitle': 'Task list from Google Tasks',
    'tasks.columns.status': 'Status',
    'tasks.columns.notes': 'Notes',
    'tasks.columns.updatedAt': 'Updated',
    'tasks.status.needsAction': 'Pending',
    'tasks.status.completed': 'Completed',
    'tasks.placeholder.title': 'Enter task title...',
    'tasks.placeholder.notes': 'Enter notes...',
    'tasks.placeholder.due': 'Due date...',
    'tasks.actions.edit': 'Edit',
    'tasks.actions.save': 'Save',
    'tasks.actions.cancel': 'Cancel',
    'tasks.actions.delete': 'Delete',
    'tasks.actions.complete': 'Complete',
    'tasks.inlineEdit.saved': 'Task updated successfully',
    'tasks.delete.confirm': 'Are you sure you want to delete this task?',
    'tasks.delete.success': 'Task deleted successfully',
    'tasks.filter.all': 'All',
    'tasks.filter.needsAction': 'Pending',
    'tasks.filter.completed': 'Completed',
    'tasks.stats.total': 'Total tasks',
    'tasks.stats.pending': 'Pending',
    'tasks.stats.completed': 'Completed',
    'tasks.stats.overdue': 'Overdue',
    'reminders.title': 'Reminders',
    'reminders.subtitle': 'Automated reminders via Telegram & Call',
    'reminders.columns.notifyType': 'Type',
    'reminders.columns.repeatType': 'Repeat',
    'reminders.actions.edit': 'Edit',
    'reminders.actions.save': 'Save',
    'reminders.actions.cancel': 'Cancel',
    'reminders.actions.delete': 'Delete',
    'reminders.actions.snooze': 'Snooze 15m',
    'reminders.inlineEdit.saved': 'Reminder updated successfully',
    'reminders.delete.confirm': 'Are you sure you want to delete this reminder?',
    'reminders.delete.success': 'Reminder deleted successfully',
    'reminders.snooze.success': 'Reminder snoozed for 15 minutes',
    'reminders.notifyType.call': 'Call',
    'reminders.notifyType.text': 'Message',
    'reminders.repeatType.none': 'None',
    'reminders.repeatType.daily': 'Daily',
    'reminders.repeatType.weekly': 'Weekly',
    'reminders.placeholder.title': 'Reminder title...',
    'period.day': 'Day',
    'period.week': 'Week',
    'period.month': 'Month',
    'period.quarter': 'Quarter',
    'period.year': 'Year',
    'period.all': 'All',
    'period.prev': 'Previous period',
    'period.next': 'Next period',
    'period.label.day': '{date}',
    'period.label.week': 'Week {week} ({range})',
    'period.label.month': '{month}/{year}',
    'period.label.quarter': 'Q{quarter}/{year}',
    'period.label.year': '{year}',
    'period.label.all': 'All time',
    'chart.toggleShow': 'Show chart',
    'chart.toggleHide': 'Hide chart',
    'chart.incomeVsExpense': 'Income vs Expense Trend',
    'chart.cashflow': 'Net cashflow',
    'chart.noData': 'No trend data available',
    'chart.income': 'Income',
    'chart.expense': 'Expense',
    'chart.net': 'Net cashflow',
  },
} as const;

export type TranslationKey = keyof (typeof messages)['vi'];
const typedMessages: Record<SupportedLocale, Record<TranslationKey, string>> = messages;

export function translate(
  locale: SupportedLocale,
  key: TranslationKey,
  values: TranslationValues = {},
): string {
  let text: string = typedMessages[locale]?.[key] ?? typedMessages[DEFAULT_LOCALE][key];
  for (const [name, value] of Object.entries(values))
    text = text.replaceAll(`{${name}}`, String(value));
  return text;
}

export interface IApiResponse<T> {
  data: T;
}

export interface IApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
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
  phoneNumber?: string;
  bankAccountNumber?: string;
  bankCode?: string;
  bankName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IDebtPaymentItem {
  id: string;
  debtId: string;
  userId: string;
  amount: number;
  paymentDate: string;
  note?: string;
  createdAt: string;
}

export interface ICreateDebtPaymentRequest {
  debtId: string;
  amount: number;
  paymentDate?: string;
  note?: string;
}

export interface IDebtListItem {
  id: string;
  direction: 'receivable' | 'payable';
  counterparty: string;
  counterpartyAlias?: string;
  contactId?: string;
  originalAmount: number;
  remainingAmount: number;
  status?: 'active' | 'settled';
  currency?: string;
  note?: string;
  dueAt?: string;
  settledAt?: string;
  payments?: IDebtPaymentItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface IExpenseListItem {
  id: string;
  category: string;
  note: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  contactId?: string;
  occurredAt: string;
  updatedAt?: string;
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
    currency?: string;
    paymentMethod?: string;
    occurredAt: string;
  }>;
  debts: Array<{
    id: string;
    direction: 'receivable' | 'payable';
    counterparty: string;
    remainingAmount: number;
    currency?: string;
    dueAt?: string;
    settledAt?: string;
  }>;
  calendar: ICalendarEventItem[];
  tasks: ITaskListItem[];
  reminders: IReminderListItem[];
  activity: Array<{ id: string; action: string; tableName: string; createdAt: string }>;
  admin?: { userCount: number; googleConnectedCount: number };
}

export interface ICalendarEventItem {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startAt?: string;
  endAt?: string;
  timeZone?: string;
}

export interface IUpdateCalendarEventRequest {
  summary?: string;
  description?: string;
  startDateTime?: string;
  endDateTime?: string;
  location?: string;
  timeZone?: string;
}

export interface ICreateCalendarEventRequest {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  timeZone?: string;
}

export interface IReminderListItem {
  id: string;
  title: string;
  remindAt: string;
  notifyType: 'text' | 'call';
  repeatType?: 'none' | 'daily' | 'weekly';
  status?: 'pending' | 'completed' | 'snoozed' | 'cancelled';
  snoozeCount?: number;
  snoozedUntil?: string;
}

export interface IUpdateReminderRequest {
  title?: string;
  remindAt?: string;
  notifyType?: 'text' | 'call';
  repeatType?: 'none' | 'daily' | 'weekly';
  status?: 'pending' | 'completed' | 'snoozed' | 'cancelled';
  snoozeCount?: number;
  snoozedUntil?: string;
}

export interface IUpdateTransactionRequest {
  type?: TransactionType;
  category?: string;
  note?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  contactId?: string;
  placeName?: string;
  occurredAt?: string;
}

export interface IUpdateExpenseRequest {
  category?: string;
  note?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  contactId?: string;
  placeName?: string;
  occurredAt?: string;
}

export interface IUpdateDebtRequest {
  direction?: 'receivable' | 'payable';
  counterparty?: string;
  counterpartyAlias?: string;
  contactId?: string;
  originalAmount?: number;
  remainingAmount?: number;
  amount?: number;
  currency?: string;
  note?: string;
  dueAt?: string;
}

export interface ITaskListItem {
  id: string;
  title: string;
  notes?: string;
  dueAt?: string;
  status?: 'needsAction' | 'completed';
  updatedAt?: string;
  completedAt?: string;
}

export interface IUpdateTaskRequest {
  title?: string;
  notes?: string;
  due?: string;
  status?: 'needsAction' | 'completed';
  taskListId?: string;
}

export interface ICreateTaskRequest {
  title: string;
  notes?: string;
  due?: string;
  taskListId?: string;
}

export interface IContactListResponse {
  contacts: IContactListItem[];
}

export type TransactionType = 'income' | 'expense';
export type DebtDirection = 'receivable' | 'payable';
export type ReminderNotifyType = 'text' | 'call';
export type ReminderRepeatType = 'none' | 'daily' | 'weekly';

export interface ITransactionItem {
  id: string;
  type: TransactionType;
  category: string;
  note: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  occurredAt: string;
  createdAt?: string;
}

export interface ICreateTransactionRequest {
  type: TransactionType;
  amount: number;
  note: string;
  category?: string;
  currency?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  contactId?: string;
  placeName?: string;
  occurredAt?: string;
}

export interface ICreateReminderRequest {
  title: string;
  remindAt: string;
  notifyType?: ReminderNotifyType;
  repeatType?: ReminderRepeatType;
  status?: 'pending' | 'completed' | 'snoozed' | 'cancelled';
  snoozeCount?: number;
  snoozedUntil?: string;
}

export interface IUpdateContactRequest {
  displayName: string;
  alias?: string;
  descriptor?: string;
  phoneNumber?: string;
  bankAccountNumber?: string;
  bankCode?: string;
  bankName?: string;
  avatarUrl?: string;
}

export interface ICombineContactsRequest {
  targetContactId: string;
  sourceContactIds: string[];
  displayName?: string;
  alias?: string;
  descriptor?: string;
}

export interface ICombineContactsResponse {
  targetContact: IContactListItem;
  affectedDebtsCount: number;
  mergedCount: number;
}
