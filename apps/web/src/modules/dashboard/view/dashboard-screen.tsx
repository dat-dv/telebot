'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { API_ROUTES, APP_ROUTES } from '@telebot/contracts';
import { clearAccessToken } from '@/modules/auth/client/auth-storage';
import { httpClient } from '@/shared/api/http-client';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { ReportsNavigation } from '@/shared/ui/reports-navigation';
import { dashboardQueryKeys, useDashboardQuery } from '../api/dashboard-query';

type Page = 'home' | 'statistics';
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

export function DashboardScreen({ page }: { page: Page }) {
  const queryClient = useQueryClient();
  const dashboard = useDashboardQuery();
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.detail() });
  const logout = async () => {
    await httpClient.post(API_ROUTES.dashboardLogout);
    clearAccessToken();
    queryClient.clear();
    window.location.assign('/reports/');
  };
  if (dashboard.isError) return <ErrorState onRetry={refresh} />;
  if (dashboard.isLoading || !dashboard.data) return <DashboardSkeleton />;
  const data = dashboard.data;
  return (
    <main className="workspace app-shell">
      <ReportsNavigation
        active={page}
        footer={
          <p className={data.user.googleConnected ? 'app-nav__status ok' : 'app-nav__status warn'}>
            ● {data.user.googleConnected ? 'Google đã kết nối' : 'Chưa kết nối Google'}
          </p>
        }
      />
      <section className="app-content">
        <header className="workspace__header">
          <div>
            <p className="eyebrow">Telebot</p>
            <h1>{page === 'home' ? 'Chào bạn' : 'Thống kê thu–chi'}</h1>
            <p className="muted">
              {page === 'home' ? 'Tổng quan cá nhân, mở từ Telegram' : 'Dữ liệu tháng hiện tại'}
            </p>
          </div>
          <div className="header-status">
            <span
              className={data.user.googleConnected ? 'connection-status ok' : 'connection-status warn'}
              role="status"
            >
              <span aria-hidden="true" />
              {data.user.googleConnected ? 'Google đã kết nối' : 'Chưa kết nối Google'}
            </span>
            <button type="button" onClick={refresh}>
              Làm mới
            </button>
            <button type="button" className="button--quiet" onClick={() => void logout()}>
              Đăng xuất
            </button>
          </div>
        </header>
        {page === 'home' ? <HomeView data={data} /> : <StatisticsView data={data} />}
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'negative';
}) {
  return (
    <article className={`metric metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function HomeView({ data }: { data: DashboardData }) {
  const attentionCount = data.debts.length + data.reminders.length + data.tasks.length;
  return (
    <>
      <section className="metric-grid" aria-label="Tổng quan tài chính">
        <Metric
          label="Số dư tháng này"
          value={money(data.finance.balance)}
          tone={data.finance.balance >= 0 ? 'positive' : 'negative'}
        />
        <Metric label="Cần thu" value={money(data.finance.receivable)} tone="positive" />
        <Metric label="Cần trả" value={money(data.finance.payable)} tone="warning" />
        <Metric label="Việc cần chú ý" value={String(attentionCount)} tone="warning" />
      </section>
      <section className="quick-actions" aria-label="Truy cập nhanh">
        <Link href={APP_ROUTES.statistics}>Xem thống kê thu–chi</Link>
        <Link href={APP_ROUTES.contacts}>Mở danh bạ liên lạc</Link>
        <Link href={APP_ROUTES.debts}>Xem công nợ</Link>
        <Link href={APP_ROUTES.expenses}>Xem khoản chi</Link>
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

function StatisticsView({ data }: { data: DashboardData }) {
  return (
    <>
      <section className="metric-grid" aria-label="Thống kê thu chi">
        <Metric label="Tổng thu" value={money(data.finance.income)} tone="positive" />
        <Metric label="Tổng chi" value={money(data.finance.expense)} tone="warning" />
        <Metric
          label="Số dư"
          value={money(data.finance.balance)}
          tone={data.finance.balance >= 0 ? 'positive' : 'negative'}
        />
        <Metric
          label="Công nợ ròng"
          value={money(data.finance.receivable - data.finance.payable)}
          tone={data.finance.receivable >= data.finance.payable ? 'positive' : 'negative'}
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

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="center">
      <section className="alert" role="alert">
        <h1>Không mở được dashboard</h1>
        <p>Phiên mở dashboard đã hết hạn. Hãy mở lại từ bot.</p>
        <button type="button" onClick={onRetry}>
          Thử lại
        </button>
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
    </main>
  );
}
