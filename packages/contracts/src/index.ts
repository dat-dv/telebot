export const API_ROUTES = {
  access: '/api/access',
  dashboard: '/api/dashboard',
  dashboardRefresh: '/api/refresh',
  dashboardLogout: '/api/logout',
  categories: '/api/categories',
  places: '/api/places',
  contacts: '/api/contacts',
  contactsCombine: '/api/contacts/combine',
  debts: '/api/debts',
  debtPayments: '/api/debts/payments',
  expenses: '/api/expenses',
  transactions: '/api/transactions',
  financeAnalytics: '/api/finance/analytics',
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
  about: '/about',
  privacy: '/privacy',
  terms: '/terms',

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
  places: '/places',
  settings: '/settings',
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
    'common.hideMoney': 'Ẩn số tiền',
    'common.showMoney': 'Hiện số tiền',
    'common.toggleMoneyVisibility': 'Ẩn/hiện số tiền',
    'common.maskedAmount': '••••••',
    'nav.home': 'Tổng quan',
    'nav.statistics': 'Phân tích',
    'nav.contacts': 'Người liên quan',
    'nav.places': 'Nơi chốn',
    'nav.debts': 'Vay & cho vay',
    'nav.expenses': 'Chi tiêu',
    'nav.income': 'Thu nhập',
    'nav.transactions': 'Thu chi',
    'nav.analytics': 'Phân tích',
    'nav.calendar': 'Lịch',
    'nav.tasks': 'Việc cần làm',
    'nav.reminders': 'Nhắc nhở',
    'nav.reports': 'Tài chính',
    'nav.settings': 'Cài đặt',
    'nav.personalSpace': 'Cá nhân',
    'nav.section.overview': 'TỔNG QUAN',
    'nav.section.finance': 'TÀI CHÍNH',
    'nav.section.planning': 'KẾ HOẠCH',
    'nav.section.data': 'DỮ LIỆU',
    'nav.section.system': 'HỆ THỐNG',
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
    'table.ordinal': 'STT',
    'table.id': 'ID',
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
    'dashboard.columns.place': 'Nơi chốn',
    'dashboard.columns.date': 'Thời gian',
    'dashboard.columns.name': 'Tên',
    'dashboard.columns.alias': 'Tên gọi',
    'dashboard.columns.descriptor': 'Ghi chú',
    'dashboard.columns.title': 'Nội dung',
    'dashboard.columns.action': 'Hoạt động',
    'dashboard.columns.schedule': 'Thời gian',
    'dashboard.error.title': 'Không mở được trang',
    'dashboard.error.desc': 'Phiên làm việc đã hết hạn. Hãy mở lại từ Telegram bot.',
    'auth.loggedOut.title': 'Đã đăng xuất thành công',
    'auth.loggedOut.desc':
      'Phiên làm việc của bạn đã kết thúc an toàn. Hãy mở lại từ Telegram bot để bắt đầu phiên mới.',
    'auth.sessionExpired.title': 'Phiên làm việc đã hết hạn',
    'auth.sessionExpired.desc':
      'Phiên truy cập đã hết hạn hoặc không tìm thấy thông tin đăng nhập. Hãy mở lại từ Telegram bot.',
    'auth.openTelegramBot': 'Mở Telegram Bot',
    'auth.clearSessionAndRetry': 'Xóa phiên & Thử lại',
    'auth.backToAbout': 'Xem trang giới thiệu',
    'auth.closeMiniApp': 'Đóng cửa sổ',
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
    'places.title': 'Nơi chốn & Địa điểm',
    'places.subtitle': 'Danh sách cửa hàng, quán ăn, bệnh viện và địa điểm thu chi của bạn',
    'places.actions.create': 'Thêm nơi chốn',
    'places.actions.edit': 'Sửa',
    'places.actions.save': 'Lưu',
    'places.actions.cancel': 'Hủy',
    'places.actions.delete': 'Xóa',
    'places.columns.name': 'Tên nơi chốn / Địa điểm',
    'places.placeholder.name': 'Nhập tên nơi chốn...',
    'places.inlineEdit.saved': 'Đã cập nhật nơi chốn',
    'places.create.success': 'Đã tạo nơi chốn thành công',
    'places.delete.confirm':
      'Bạn có chắc chắn muốn xóa nơi chốn này không? Các giao dịch cũ vẫn sẽ được giữ nguyên.',
    'places.delete.success': 'Đã xóa nơi chốn thành công',
    'places.noData': 'Chưa có nơi chốn nào',
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
    'transactions.placeholder.place': 'Nhập nơi chốn hoặc cửa hàng...',
    'transactions.placeholder.note': 'Nhập ghi chú...',
    'transactions.placeholder.amount': 'Nhập số tiền...',
    'analytics.title': 'Báo cáo & Phân tích',
    'analytics.subtitle': 'Trực quan hóa xu hướng dòng tiền, cơ cấu chi tiêu và công nợ',
    'analytics.kpi.netSavings': 'Tiết kiệm ròng',
    'analytics.kpi.savingsRate': 'Tỷ lệ tích lũy',
    'analytics.chart.cashflowTrend': 'Xu hướng dòng tiền',
    'analytics.chart.spendingDistribution': 'Cơ cấu chi tiêu',
    'analytics.chart.debtBreakdown': 'Cơ cấu công nợ',
    'analytics.chart.netBalance': 'Số dư ròng',
    'analytics.chart.receivables': 'Phải thu (Cho vay)',
    'analytics.chart.payables': 'Phải trả (Đi vay)',
    'analytics.emptyChartData': 'Không có dữ liệu trong khoảng thời gian này',
    'analytics.topCategories': 'Top danh mục chi tiêu',
    'analytics.topDebtors': 'Top người vay / nợ',
    'analytics.drilldownTitle': 'Chi tiết giao dịch & công nợ trong kỳ',
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
    'calendar.view.grid': 'Lưới tháng',
    'calendar.view.table': 'Danh sách',
    'calendar.nav.today': 'Hôm nay',
    'calendar.nav.prev': 'Tháng trước',
    'calendar.nav.next': 'Tháng sau',
    'calendar.day.mon': 'T2',
    'calendar.day.tue': 'T3',
    'calendar.day.wed': 'T4',
    'calendar.day.thu': 'T5',
    'calendar.day.fri': 'T6',
    'calendar.day.sat': 'T7',
    'calendar.day.sun': 'CN',
    'calendar.moreEvents': '+{count} sự kiện',
    'calendar.selectedDayEvents': 'Sự kiện ngày {date}',
    'calendar.noEventsOnDay': 'Không có sự kiện nào trong ngày này',
    'calendar.quickCreate': 'Tạo nhanh sự kiện',
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
    'settings.title': 'Cài đặt chung',
    'settings.subtitle': 'Quản lý danh mục thu chi và cấu hình hệ thống',
    'settings.tabs.categories': 'Danh mục Thu & Chi',
    'settings.tabs.preferences': 'Tùy chọn hệ thống',
    'settings.categories.expenseTitle': 'Danh mục Chi tiêu',
    'settings.categories.incomeTitle': 'Danh mục Thu nhập',
    'settings.categories.addExpense': '+ Thêm danh mục chi',
    'settings.categories.addIncome': '+ Thêm danh mục thu',
    'settings.categories.namePlaceholder': 'Nhập tên danh mục...',
    'settings.categories.name': 'Tên danh mục',
    'settings.categories.type': 'Loại',
    'settings.categories.count': '{count} danh mục',
    'settings.categories.empty': 'Chưa có danh mục nào',
    'settings.categories.deleteConfirm': 'Bạn có chắc chắn muốn xóa danh mục này không?',
    'settings.categories.created': 'Đã tạo danh mục thành công',
    'settings.categories.updated': 'Đã cập nhật danh mục',
    'settings.categories.deleted': 'Đã xóa danh mục',
    'settings.categories.exists': 'Danh mục này đã tồn tại',
    'settings.preferences.languageDescription': 'Hỗ trợ Tiếng Việt và English',
    'settings.preferences.themeTitle': 'Giao diện & Chủ đề',
    'settings.preferences.themeDescription': 'Chế độ Sáng / Tối (Light & Dark mode)',
    'settings.preferences.supported': 'Đã hỗ trợ',
    'public.brand': 'Telebot',
    'public.supportEmail': 'datdoan.dev@gmail.com',
    'public.updated': 'CẬP NHẬT: 24/08/2026',
    'public.about.navigation': 'Điều hướng thông tin',
    'public.about.privacy': 'Quyền riêng tư',
    'public.about.terms': 'Điều khoản',
    'public.about.eyebrow': 'TRỢ LÝ CÁ NHÂN TRÊN TELEGRAM',
    'public.about.title': 'Quản lý kế hoạch và tài chính cá nhân, gọn trong một nơi.',
    'public.about.description':
      'Telebot giúp bạn ghi nhận thu chi, theo dõi công nợ, tạo lời nhắc và đồng bộ lịch trình hoặc việc cần làm với Google khi bạn lựa chọn kết nối.',
    'public.about.telegram': 'Mở Telegram để bắt đầu',
    'public.about.features': 'Tính năng Telebot',
    'public.about.financeTitle': 'Quản lý tài chính',
    'public.about.financeDescription':
      'Ghi nhận thu chi, theo dõi khoản vay và xem lại tổng quan theo thời gian.',
    'public.about.planningTitle': 'Kế hoạch rõ ràng',
    'public.about.planningDescription':
      'Tạo nhắc nhở, theo dõi việc cần làm và quản lý lịch trình cá nhân.',
    'public.about.googleTitle': 'Kết nối Google theo lựa chọn',
    'public.about.googleDescription':
      'Khi bạn cấp quyền, Telebot dùng Google Calendar và Google Tasks để thực hiện đúng các lệnh bạn yêu cầu.',
    'public.about.copyright': '© {year} Telebot',
    'public.about.support': 'Hỗ trợ: {email}',
    'public.about.privacyPolicy': 'Privacy Policy',
    'public.about.termsOfService': 'Terms of Service',
    'public.privacy.title': 'Chính sách quyền riêng tư',
    'public.privacy.intro':
      'Telebot tôn trọng quyền riêng tư của bạn. Chính sách này mô tả dữ liệu chúng tôi xử lý, lý do xử lý và các lựa chọn của bạn.',
    'public.privacy.dataTitle': '1. Dữ liệu chúng tôi xử lý',
    'public.privacy.dataDescription':
      'Để vận hành bot, Telebot lưu Telegram user ID, dữ liệu tài chính và kế hoạch do bạn nhập, cùng dữ liệu kỹ thuật cần thiết để duy trì dịch vụ.',
    'public.privacy.scopesIntro':
      'Khi bạn chủ động kết nối Google, chúng tôi chỉ yêu cầu các quyền sau:',
    'public.privacy.profileScope':
      'Thông tin hồ sơ cơ bản và địa chỉ email để nhận diện tài khoản đã kết nối.',
    'public.privacy.calendarScope':
      'Google Calendar để đọc, tạo, cập nhật hoặc xóa sự kiện theo lệnh của bạn.',
    'public.privacy.tasksScope':
      'Google Tasks để đọc, tạo, cập nhật hoặc hoàn thành việc cần làm theo lệnh của bạn.',
    'public.privacy.useTitle': '2. Cách chúng tôi sử dụng dữ liệu Google',
    'public.privacy.useDescription':
      'Dữ liệu Google chỉ được dùng để cung cấp các tính năng Calendar và Tasks mà bạn trực tiếp yêu cầu trong Telebot. Chúng tôi không bán, cho thuê, dùng dữ liệu Google cho quảng cáo, hoặc chuyển dữ liệu đó cho bên thứ ba ngoài nhà cung cấp hạ tầng cần thiết để vận hành dịch vụ.',
    'public.privacy.policyPrefix':
      'Việc Telebot sử dụng và chuyển giao dữ liệu nhận từ Google APIs tuân thủ ',
    'public.privacy.policyLink': 'Google API Services User Data Policy',
    'public.privacy.policySuffix': ', bao gồm yêu cầu Limited Use.',
    'public.privacy.securityTitle': '3. Lưu trữ và bảo mật',
    'public.privacy.securityDescription':
      'Token truy cập Google được mã hóa trước khi lưu trong cơ sở dữ liệu. Chúng tôi áp dụng biện pháp kỹ thuật hợp lý để hạn chế truy cập trái phép; tuy vậy không có phương thức truyền hay lưu trữ dữ liệu nào an toàn tuyệt đối.',
    'public.privacy.retentionTitle': '4. Lưu giữ và xóa dữ liệu',
    'public.privacy.retentionDescription':
      'Chúng tôi lưu dữ liệu trong thời gian cần thiết để cung cấp dịch vụ hoặc theo yêu cầu pháp luật. Bạn có thể yêu cầu thu hồi kết nối Google và xóa token/dữ liệu liên quan bằng cách gửi email tới {email} từ địa chỉ email đã kết nối. Chúng tôi sẽ phản hồi yêu cầu trong thời hạn hợp lý.',
    'public.privacy.contactTitle': '5. Liên hệ',
    'public.privacy.contactDescription':
      'Nếu có câu hỏi về quyền riêng tư hoặc dữ liệu cá nhân, liên hệ {email}.',
    'public.privacy.about': 'Giới thiệu Telebot',
    'public.terms.title': 'Điều khoản sử dụng',
    'public.terms.acceptanceTitle': '1. Chấp nhận điều khoản',
    'public.terms.acceptanceDescription':
      'Bằng việc sử dụng Telebot, bạn đồng ý với các điều khoản này và Chính sách quyền riêng tư. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.',
    'public.terms.scopeTitle': '2. Phạm vi dịch vụ',
    'public.terms.scopeDescription':
      'Telebot là công cụ hỗ trợ quản lý thông tin cá nhân, tài chính, lịch trình và việc cần làm. Dịch vụ không cung cấp tư vấn tài chính, pháp lý hoặc đầu tư chuyên nghiệp.',
    'public.terms.accountTitle': '3. Tài khoản và quyền truy cập',
    'public.terms.accountDescription':
      'Bạn chịu trách nhiệm với các lệnh được gửi từ tài khoản Telegram của mình. Kết nối Google là tự nguyện và có thể được thu hồi theo hướng dẫn tại Chính sách quyền riêng tư.',
    'public.terms.legalTitle': '4. Sử dụng hợp pháp',
    'public.terms.legalDescription':
      'Bạn không được sử dụng Telebot để vi phạm pháp luật, xâm phạm quyền của người khác, can thiệp trái phép vào dịch vụ hoặc gây ảnh hưởng đến hoạt động của hệ thống.',
    'public.terms.changeTitle': '5. Thay đổi dịch vụ',
    'public.terms.changeDescription':
      'Chúng tôi có thể cập nhật dịch vụ hoặc điều khoản khi cần thiết. Phiên bản mới sẽ được công bố trên trang này.',
    'public.terms.contactTitle': '6. Liên hệ',
    'public.terms.contactDescription': 'Liên hệ hỗ trợ: {email}.',
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
    'common.hideMoney': 'Hide amounts',
    'common.showMoney': 'Show amounts',
    'common.toggleMoneyVisibility': 'Toggle amount visibility',
    'common.maskedAmount': '••••••',
    'nav.home': 'Overview',
    'nav.statistics': 'Analytics',
    'nav.contacts': 'People',
    'nav.places': 'Places',
    'nav.debts': 'Loans & Debts',
    'nav.expenses': 'Expenses',
    'nav.income': 'Income',
    'nav.transactions': 'Transactions',
    'nav.analytics': 'Analytics',
    'nav.calendar': 'Calendar',
    'nav.tasks': 'Tasks',
    'nav.reminders': 'Reminders',
    'nav.reports': 'Finance',
    'nav.settings': 'Settings',
    'nav.personalSpace': 'Personal',
    'nav.section.overview': 'OVERVIEW',
    'nav.section.finance': 'FINANCE',
    'nav.section.planning': 'PLANNING',
    'nav.section.data': 'DATA',
    'nav.section.system': 'SYSTEM',
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
    'table.ordinal': 'No.',
    'table.id': 'ID',
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
    'dashboard.columns.place': 'Place',
    'dashboard.columns.date': 'Time',
    'dashboard.columns.name': 'Name',
    'dashboard.columns.alias': 'Alias',
    'dashboard.columns.descriptor': 'Note',
    'dashboard.columns.title': 'Title',
    'dashboard.columns.action': 'Action',
    'dashboard.columns.schedule': 'Schedule',
    'dashboard.error.title': 'Unable to load page',
    'dashboard.error.desc': 'Session expired. Please open again from the Telegram bot.',
    'auth.loggedOut.title': 'Logged out successfully',
    'auth.loggedOut.desc':
      'Your session has ended securely. Please open again from the Telegram bot to start a new session.',
    'auth.sessionExpired.title': 'Session expired',
    'auth.sessionExpired.desc':
      'Your access session has expired or no credentials were found. Please open again from the Telegram bot.',
    'auth.openTelegramBot': 'Open Telegram Bot',
    'auth.clearSessionAndRetry': 'Clear session & retry',
    'auth.backToAbout': 'About Telebot',
    'auth.closeMiniApp': 'Close window',
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
    'places.title': 'Places & Locations',
    'places.subtitle': 'Stores, restaurants, hospitals and locations used in your transactions',
    'places.actions.create': 'Add place',
    'places.actions.edit': 'Edit',
    'places.actions.save': 'Save',
    'places.actions.cancel': 'Cancel',
    'places.actions.delete': 'Delete',
    'places.columns.name': 'Place / Location name',
    'places.placeholder.name': 'Enter place name...',
    'places.inlineEdit.saved': 'Place updated successfully',
    'places.create.success': 'Place created successfully',
    'places.delete.confirm':
      'Are you sure you want to delete this place? Historical transactions will be preserved.',
    'places.delete.success': 'Place deleted successfully',
    'places.noData': 'No places found',
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
    'transactions.placeholder.place': 'Enter a place or store...',
    'transactions.placeholder.note': 'Enter note...',
    'transactions.placeholder.amount': 'Enter amount...',
    'analytics.title': 'Reports & Analytics',
    'analytics.subtitle': 'Visualize cashflow trends, spending distribution, and debt structure',
    'analytics.kpi.netSavings': 'Net Savings',
    'analytics.kpi.savingsRate': 'Savings Rate',
    'analytics.chart.cashflowTrend': 'Cashflow Trend',
    'analytics.chart.spendingDistribution': 'Spending Distribution',
    'analytics.chart.debtBreakdown': 'Debt Structure',
    'analytics.chart.netBalance': 'Net Balance',
    'analytics.chart.receivables': 'Receivables (Lent)',
    'analytics.chart.payables': 'Payables (Borrowed)',
    'analytics.emptyChartData': 'No data for the selected period',
    'analytics.topCategories': 'Top Spending Categories',
    'analytics.topDebtors': 'Top Debtors / Creditors',
    'analytics.drilldownTitle': 'Detailed Transactions & Debts',
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
    'calendar.view.grid': 'Month Grid',
    'calendar.view.table': 'List View',
    'calendar.nav.today': 'Today',
    'calendar.nav.prev': 'Previous Month',
    'calendar.nav.next': 'Next Month',
    'calendar.day.mon': 'Mon',
    'calendar.day.tue': 'Tue',
    'calendar.day.wed': 'Wed',
    'calendar.day.thu': 'Thu',
    'calendar.day.fri': 'Fri',
    'calendar.day.sat': 'Sat',
    'calendar.day.sun': 'Sun',
    'calendar.moreEvents': '+{count} more',
    'calendar.selectedDayEvents': 'Events on {date}',
    'calendar.noEventsOnDay': 'No events on this day',
    'calendar.quickCreate': 'Quick Add Event',
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
    'settings.title': 'General Settings',
    'settings.subtitle': 'Manage finance categories and system configuration',
    'settings.tabs.categories': 'Categories',
    'settings.tabs.preferences': 'Preferences',
    'settings.categories.expenseTitle': 'Expense Categories',
    'settings.categories.incomeTitle': 'Income Categories',
    'settings.categories.addExpense': '+ Add Expense Category',
    'settings.categories.addIncome': '+ Add Income Category',
    'settings.categories.namePlaceholder': 'Enter category name...',
    'settings.categories.name': 'Category Name',
    'settings.categories.type': 'Type',
    'settings.categories.count': '{count} categories',
    'settings.categories.empty': 'No categories yet',
    'settings.categories.deleteConfirm': 'Are you sure you want to delete this category?',
    'settings.categories.created': 'Category created successfully',
    'settings.categories.updated': 'Category updated successfully',
    'settings.categories.deleted': 'Category deleted successfully',
    'settings.categories.exists': 'Category already exists',
    'settings.preferences.languageDescription': 'Support Vietnamese and English',
    'settings.preferences.themeTitle': 'Interface & Theme',
    'settings.preferences.themeDescription': 'Light and Dark mode',
    'settings.preferences.supported': 'Supported',
    'public.brand': 'Telebot',
    'public.supportEmail': 'datdoan.dev@gmail.com',
    'public.updated': 'UPDATED: 24/08/2026',
    'public.about.navigation': 'Information navigation',
    'public.about.privacy': 'Privacy',
    'public.about.terms': 'Terms',
    'public.about.eyebrow': 'YOUR PERSONAL TELEGRAM ASSISTANT',
    'public.about.title': 'Manage your personal finances and plans in one place.',
    'public.about.description':
      'Telebot helps you record income and expenses, track debts, create reminders, and sync your calendar or tasks with Google when you choose to connect.',
    'public.about.telegram': 'Open Telegram to get started',
    'public.about.features': 'Telebot features',
    'public.about.financeTitle': 'Financial management',
    'public.about.financeDescription':
      'Record income and expenses, track loans, and review your overview over time.',
    'public.about.planningTitle': 'Clear planning',
    'public.about.planningDescription':
      'Create reminders, track tasks, and manage your personal schedule.',
    'public.about.googleTitle': 'Google connection by choice',
    'public.about.googleDescription':
      'When you grant permission, Telebot uses Google Calendar and Google Tasks only to perform the actions you request.',
    'public.about.copyright': '© {year} Telebot',
    'public.about.support': 'Support: {email}',
    'public.about.privacyPolicy': 'Privacy Policy',
    'public.about.termsOfService': 'Terms of Service',
    'public.privacy.title': 'Privacy Policy',
    'public.privacy.intro':
      'Telebot respects your privacy. This policy explains the data we process, why we process it, and your choices.',
    'public.privacy.dataTitle': '1. Data we process',
    'public.privacy.dataDescription':
      'To operate the bot, Telebot stores your Telegram user ID, finance and planning data you enter, and technical data required to run the service.',
    'public.privacy.scopesIntro':
      'When you choose to connect Google, we request only the following permissions:',
    'public.privacy.profileScope':
      'Basic profile information and email address to identify the connected account.',
    'public.privacy.calendarScope':
      'Google Calendar to read, create, update, or delete events that you request.',
    'public.privacy.tasksScope':
      'Google Tasks to read, create, update, or complete tasks that you request.',
    'public.privacy.useTitle': '2. How we use Google data',
    'public.privacy.useDescription':
      'Google data is used only to provide the Calendar and Tasks features you directly request in Telebot. We do not sell, rent, use Google data for advertising, or transfer it to third parties except infrastructure providers required to operate the service.',
    'public.privacy.policyPrefix':
      'Telebot’s use and transfer of information received from Google APIs adheres to the ',
    'public.privacy.policyLink': 'Google API Services User Data Policy',
    'public.privacy.policySuffix': ', including the Limited Use requirements.',
    'public.privacy.securityTitle': '3. Storage and security',
    'public.privacy.securityDescription':
      'Google access tokens are encrypted before storage in the database. We use reasonable technical measures to limit unauthorized access; however, no transmission or storage method is completely secure.',
    'public.privacy.retentionTitle': '4. Retention and deletion',
    'public.privacy.retentionDescription':
      'We retain data for as long as needed to provide the service or as required by law. You may request that we revoke your Google connection and delete related token/data by emailing {email} from the connected email address. We will respond within a reasonable period.',
    'public.privacy.contactTitle': '5. Contact',
    'public.privacy.contactDescription':
      'For questions about privacy or personal data, contact {email}.',
    'public.privacy.about': 'About Telebot',
    'public.terms.title': 'Terms of Service',
    'public.terms.acceptanceTitle': '1. Acceptance',
    'public.terms.acceptanceDescription':
      'By using Telebot, you agree to these terms and the Privacy Policy. If you do not agree, please do not use the service.',
    'public.terms.scopeTitle': '2. Service scope',
    'public.terms.scopeDescription':
      'Telebot is a tool for managing personal information, finances, schedules, and tasks. It does not provide professional financial, legal, or investment advice.',
    'public.terms.accountTitle': '3. Account and access',
    'public.terms.accountDescription':
      'You are responsible for commands sent from your Telegram account. Connecting Google is optional and can be revoked as described in the Privacy Policy.',
    'public.terms.legalTitle': '4. Lawful use',
    'public.terms.legalDescription':
      'You may not use Telebot to violate the law, infringe others’ rights, interfere with the service, or harm system operations.',
    'public.terms.changeTitle': '5. Service changes',
    'public.terms.changeDescription':
      'We may update the service or these terms when necessary. The latest version will be published on this page.',
    'public.terms.contactTitle': '6. Contact',
    'public.terms.contactDescription': 'Support contact: {email}.',
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
  occurredAt: string;
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
  placeId?: string;
  placeName?: string;
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
    placeId?: string;
    placeName?: string;
    occurredAt: string;
  }>;
  debts: Array<{
    id: string;
    direction: 'receivable' | 'payable';
    counterparty: string;
    remainingAmount: number;
    currency?: string;
    occurredAt: string;
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

export interface ICalendarEventsQuery {
  timeMin: string;
  timeMax: string;
  query?: string;
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
  placeId?: string | null;
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
  placeId?: string | null;
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
  occurredAt?: string;
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

export const DEFAULT_INCOME_CATEGORIES = [
  'Lương',
  'Thưởng',
  'Đầu tư',
  'Thu nợ',
  'Kinh doanh',
  'Quà tặng',
  'Khác',
] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Ăn uống',
  'Di chuyển',
  'Mua sắm',
  'Hóa đơn & Tiện ích',
  'Giải trí',
  'Nhà cửa',
  'Sức khỏe',
  'Giáo dục',
  'Gia đình',
  'Khác',
] as const;

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
  placeId?: string;
  placeName?: string;
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
  placeId?: string;
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

export interface ICategoryItem {
  id: string;
  type: 'income' | 'expense';
  name: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IFinancePlace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ICreatePlaceRequest {
  name: string;
}

export interface IUpdatePlaceRequest {
  name: string;
}

export interface ICreateCategoryRequest {
  type: 'income' | 'expense';
  name: string;
  color?: string;
  icon?: string;
}

export interface IUpdateCategoryRequest {
  name?: string;
  color?: string;
  icon?: string;
}

export interface ICategoryListResponse {
  categories: ICategoryItem[];
}

export type AnalyticsGrain = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface IFinanceAnalyticsSummary {
  income: number;
  expense: number;
  balance: number;
  netSavingsRate: number;
  receivableTotal: number;
  payableTotal: number;
}

export interface IAnalyticsTrendBucket {
  key: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
  startAt: string;
  endAt: string;
}

export interface IAnalyticsCategoryBreakdown {
  category: string;
  type: 'expense' | 'income';
  amount: number;
  count: number;
  percentage: number;
  color?: string;
}

export interface IAnalyticsDebtBreakdown {
  receivable: number;
  payable: number;
  netDebt: number;
  topReceivables: Array<{ contactId?: string; counterparty: string; amount: number }>;
  topPayables: Array<{ contactId?: string; counterparty: string; amount: number }>;
}

export interface IFinanceAnalyticsResponse {
  summary: IFinanceAnalyticsSummary;
  trend: IAnalyticsTrendBucket[];
  categories: IAnalyticsCategoryBreakdown[];
  debts: IAnalyticsDebtBreakdown;
}
