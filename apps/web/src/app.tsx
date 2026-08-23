import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { APP_ROUTES, API_ROUTES, type IContactListItem } from '@telebot/contracts';
import { clearAccessToken } from './auth-storage';
import { DataPanel, DataTable, type DataTableColumn } from './components/data-table';
import { contactsQueryKeys, useContactsQuery } from './contacts-query';
import { dashboardQueryKeys, useDashboardQuery } from './dashboard-query';
import { httpClient } from './http-client';

type Page = 'home' | 'statistics' | 'contacts';
type DashboardData = NonNullable<ReturnType<typeof useDashboardQuery>['data']>;

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(value),
      )
    : 'Chưa đặt';
const pageFromPath = (path: string): Page =>
  path === APP_ROUTES.statistics
    ? 'statistics'
    : path === APP_ROUTES.contacts
      ? 'contacts'
      : 'home';
const pathForPage = (page: Page) =>
  page === 'statistics'
    ? APP_ROUTES.statistics
    : page === 'contacts'
      ? APP_ROUTES.contacts
      : APP_ROUTES.reports;

export function App() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState<Page>(() => pageFromPath(window.location.pathname));
  const dashboard = useDashboardQuery();
  const contacts = useContactsQuery(page === 'contacts');
  useEffect(() => {
    const updatePage = () => setPage(pageFromPath(window.location.pathname));
    window.addEventListener('popstate', updatePage);
    return () => window.removeEventListener('popstate', updatePage);
  }, []);
  const navigate = (nextPage: Page) => {
    window.history.pushState(null, '', pathForPage(nextPage));
    setPage(nextPage);
  };
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });
    if (page === 'contacts')
      void queryClient.invalidateQueries({ queryKey: contactsQueryKeys.list() });
  };
  const logout = async () => {
    await httpClient.post(API_ROUTES.dashboardLogout);
    clearAccessToken();
    queryClient.clear();
    window.location.reload();
  };
  if (dashboard.isError) return <ErrorState onRetry={refresh} />;
  if (dashboard.isLoading || !dashboard.data) return <DashboardSkeleton />;
  const data = dashboard.data;
  return (
    <main className="workspace app-shell">
      <aside className="app-nav" aria-label="Điều hướng dashboard">
        <div className="app-nav__brand">
          <span>Telebot</span>
          <small>Cá nhân</small>
        </div>
        <nav>
          <NavItem active={page === 'home'} label="Trang chủ" onClick={() => navigate('home')} />
          <NavItem
            active={page === 'statistics'}
            label="Thống kê"
            onClick={() => navigate('statistics')}
          />
          <NavItem
            active={page === 'contacts'}
            label="Liên lạc"
            onClick={() => navigate('contacts')}
          />
        </nav>
        <p className={data.user.googleConnected ? 'app-nav__status ok' : 'app-nav__status warn'}>
          ● {data.user.googleConnected ? 'Google đã kết nối' : 'Chưa kết nối Google'}
        </p>
      </aside>
      <section className="app-content">
        <header className="workspace__header">
          <div>
            <p className="eyebrow">Telebot</p>
            <h1>
              {page === 'home'
                ? 'Chào bạn'
                : page === 'statistics'
                  ? 'Thống kê thu–chi'
                  : 'Liên lạc'}
            </h1>
            <p className="muted">
              {page === 'home'
                ? 'Tổng quan cá nhân, mở từ Telegram'
                : page === 'statistics'
                  ? 'Dữ liệu tháng hiện tại'
                  : 'Danh bạ công nợ của bạn'}
            </p>
          </div>
          <div className="header-status">
            <button onClick={refresh}>Làm mới</button>
            <button className="button--quiet" onClick={() => void logout()}>
              Đăng xuất
            </button>
          </div>
        </header>
        {page === 'home' && <HomePage data={data} onNavigate={navigate} />}
        {page === 'statistics' && <StatisticsPage data={data} />}
        {page === 'contacts' && <ContactsPage contacts={contacts} />}
      </section>
    </main>
  );
}

function NavItem({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={active ? 'app-nav__item is-active' : 'app-nav__item'}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function HomePage({ data, onNavigate }: { data: DashboardData; onNavigate: (page: Page) => void }) {
  const attentionCount = data.debts.length + data.reminders.length + data.tasks.length;
  return (
    <>
      <section className="metric-grid" aria-label="Tổng quan tài chính">
        <Metric label="Số dư tháng này" value={money(data.finance.balance)} />
        <Metric label="Cần thu" value={money(data.finance.receivable)} />
        <Metric label="Cần trả" value={money(data.finance.payable)} />
        <Metric label="Việc cần chú ý" value={String(attentionCount)} />
      </section>
      <section className="quick-actions" aria-label="Truy cập nhanh">
        <button onClick={() => onNavigate('statistics')}>Xem thống kê thu–chi</button>
        <button onClick={() => onNavigate('contacts')}>Mở danh bạ liên lạc</button>
      </section>
      <section className="content-grid">
        <DataPanel title="Việc cần làm" description="Danh sách chưa hoàn tất">
          <DataTable
            ariaLabel="Việc cần làm"
            rows={data.tasks}
            emptyMessage={
              data.user.googleConnected
                ? 'Chưa có việc chưa hoàn tất'
                : 'Kết nối Google từ bot để xem tasks'
            }
            columns={taskColumns}
          />
        </DataPanel>
        <DataPanel title="Lời nhắc sắp tới" description="Thông báo đã lên lịch">
          <DataTable
            ariaLabel="Lời nhắc sắp tới"
            rows={data.reminders}
            emptyMessage="Chưa có lời nhắc"
            columns={reminderColumns}
          />
        </DataPanel>
        <DataPanel title="Lịch 7 ngày tới" description="Sự kiện từ Google Calendar">
          <DataTable
            ariaLabel="Lịch 7 ngày tới"
            rows={data.calendar}
            emptyMessage={
              data.user.googleConnected
                ? 'Chưa có lịch sắp tới'
                : 'Kết nối Google từ bot để xem lịch'
            }
            columns={calendarColumns}
          />
        </DataPanel>
        <DataPanel title="Hoạt động gần đây" description="Nhật ký thao tác mới nhất">
          <DataTable
            ariaLabel="Hoạt động gần đây"
            rows={data.activity}
            emptyMessage="Chưa có hoạt động"
            columns={activityColumns}
          />
        </DataPanel>
      </section>
    </>
  );
}

function StatisticsPage({ data }: { data: DashboardData }) {
  return (
    <>
      <section className="metric-grid" aria-label="Thống kê thu chi">
        <Metric label="Tổng thu" value={money(data.finance.income)} />
        <Metric label="Tổng chi" value={money(data.finance.expense)} />
        <Metric label="Số dư" value={money(data.finance.balance)} />
        <Metric
          label="Công nợ ròng"
          value={money(data.finance.receivable - data.finance.payable)}
        />
      </section>
      {data.admin && (
        <section className="admin-strip">
          <strong>Quản trị</strong>
          <span>{data.admin.userCount} người dùng</span>
          <span>{data.admin.googleConnectedCount} đã kết nối Google</span>
        </section>
      )}
      <section className="content-grid content-grid--wide">
        <DataPanel title="Giao dịch gần đây" description="Các phát sinh mới nhất">
          <DataTable
            ariaLabel="Giao dịch gần đây"
            rows={data.transactions}
            emptyMessage="Chưa có giao dịch"
            columns={transactionColumns}
          />
        </DataPanel>
        <DataPanel title="Công nợ đang mở" description="Các khoản cần theo dõi">
          <DataTable
            ariaLabel="Công nợ đang mở"
            rows={data.debts}
            emptyMessage="Không có công nợ"
            columns={debtColumns}
          />
        </DataPanel>
      </section>
    </>
  );
}
function ContactsPage({ contacts }: { contacts: ReturnType<typeof useContactsQuery> }) {
  if (contacts.isError)
    return (
      <section className="inline-alert" role="alert">
        <strong>Không tải được danh bạ</strong>
        <span>Hãy làm mới trang hoặc mở lại từ bot.</span>
      </section>
    );
  return (
    <section className="content-grid content-grid--wide">
      <DataPanel title="Danh bạ công nợ" description="Các liên lạc đã lưu trong hệ thống">
        <DataTable
          ariaLabel="Danh bạ công nợ"
          rows={contacts.data ?? []}
          loading={contacts.isLoading}
          emptyMessage="Chưa có liên lạc nào"
          columns={contactColumns}
        />
      </DataPanel>
    </section>
  );
}
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="center">
      <section className="alert" role="alert">
        <h1>Không mở được dashboard</h1>
        <p>Phiên mở dashboard đã hết hạn. Hãy mở lại từ bot.</p>
        <button onClick={onRetry}>Thử lại</button>
      </section>
    </main>
  );
}

const transactionColumns: DataTableColumn<DashboardData['transactions'][number]>[] = [
  {
    id: 'category',
    header: 'Giao dịch',
    cell: (item) => (
      <span className="cell-primary">
        {item.type === 'income' ? 'Thu' : 'Chi'} · {item.category}
      </span>
    ),
  },
  {
    id: 'note',
    header: 'Ghi chú',
    cell: (item) => <span className="cell-muted">{item.note || '—'}</span>,
  },
  {
    id: 'amount',
    header: 'Số tiền',
    align: 'right',
    cell: (item) => <strong>{money(item.amount)}</strong>,
  },
];
const debtColumns: DataTableColumn<DashboardData['debts'][number]>[] = [
  {
    id: 'counterparty',
    header: 'Đối tác',
    cell: (item) => (
      <span className="cell-primary">
        {item.direction === 'receivable' ? 'Cần thu' : 'Cần trả'} · {item.counterparty}
      </span>
    ),
  },
  {
    id: 'dueAt',
    header: 'Hạn thanh toán',
    cell: (item) => <span className="cell-muted">{date(item.dueAt)}</span>,
  },
  {
    id: 'amount',
    header: 'Còn lại',
    align: 'right',
    cell: (item) => <strong>{money(item.remainingAmount)}</strong>,
  },
];
const calendarColumns: DataTableColumn<DashboardData['calendar'][number]>[] = [
  {
    id: 'title',
    header: 'Sự kiện',
    cell: (item) => <span className="cell-primary">{item.title}</span>,
  },
  {
    id: 'startAt',
    header: 'Thời gian',
    align: 'right',
    cell: (item) => <span className="cell-muted">{date(item.startAt)}</span>,
  },
];
const taskColumns: DataTableColumn<DashboardData['tasks'][number]>[] = [
  {
    id: 'title',
    header: 'Công việc',
    cell: (item) => <span className="cell-primary">{item.title}</span>,
  },
  {
    id: 'dueAt',
    header: 'Hạn hoàn tất',
    cell: (item) => <span className="cell-muted">{date(item.dueAt)}</span>,
  },
];
const reminderColumns: DataTableColumn<DashboardData['reminders'][number]>[] = [
  {
    id: 'title',
    header: 'Lời nhắc',
    cell: (item) => <span className="cell-primary">{item.title}</span>,
  },
  {
    id: 'schedule',
    header: 'Lịch gửi',
    cell: (item) => (
      <span className="cell-muted">
        {item.notifyType === 'call' ? 'Gọi' : 'Tin nhắn'} · {date(item.remindAt)}
      </span>
    ),
  },
];
const activityColumns: DataTableColumn<DashboardData['activity'][number]>[] = [
  {
    id: 'action',
    header: 'Hoạt động',
    cell: (item) => (
      <span className="cell-primary">
        {item.action} · {item.tableName}
      </span>
    ),
  },
  {
    id: 'createdAt',
    header: 'Thời gian',
    cell: (item) => <span className="cell-muted">{date(item.createdAt)}</span>,
  },
];
const contactColumns: DataTableColumn<IContactListItem>[] = [
  {
    id: 'displayName',
    header: 'Tên',
    cell: (item) => <span className="cell-primary">{item.displayName}</span>,
  },
  {
    id: 'alias',
    header: 'Biệt danh',
    cell: (item) => <span className="cell-muted">{item.alias || '—'}</span>,
  },
  {
    id: 'descriptor',
    header: 'Mô tả',
    cell: (item) => <span className="cell-muted">{item.descriptor || '—'}</span>,
  },
  {
    id: 'createdAt',
    header: 'Ngày tạo',
    align: 'right',
    cell: (item) => <span className="cell-muted">{date(item.createdAt)}</span>,
  },
];

function DashboardSkeleton() {
  return (
    <main className="workspace workspace--loading" aria-busy="true">
      <header className="workspace__header">
        <div>
          <p className="eyebrow">Telebot</p>
          <h1>Đang tải dashboard</h1>
        </div>
      </header>
      <section className="metric-grid skeleton-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="metric" key={index}>
            <span className="skeleton skeleton--label" />
            <strong className="skeleton skeleton--value" />
          </div>
        ))}
      </section>
      <section className="content-grid" aria-label="Đang tải dữ liệu dashboard">
        {Array.from({ length: 4 }, (_, index) => (
          <DataPanel key={index} title="Đang tải">
            <DataTable
              ariaLabel="Đang tải"
              rows={[]}
              emptyMessage=""
              loading
              columns={[
                { id: 'first', header: 'Dữ liệu', cell: () => null },
                { id: 'second', header: 'Trạng thái', cell: () => null },
              ]}
            />
          </DataPanel>
        ))}
      </section>
    </main>
  );
}
