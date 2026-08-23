'use client';

import { useQueryClient } from '@tanstack/react-query';
import { API_ROUTES, APP_ROUTES, type IDebtListItem } from '@telebot/contracts';
import { clearAccessToken } from '@/modules/auth/client/auth-storage';
import { httpClient } from '@/shared/api/http-client';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { ReportsNavigation } from '@/shared/ui/reports-navigation';
import { debtsQueryKeys, useDebtsQuery } from '../api/debts-query';

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(value))
    : 'Chưa đặt';

export function DebtsScreen() {
  const queryClient = useQueryClient();
  const debts = useDebtsQuery();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: debtsQueryKeys.list() });
  const logout = async () => {
    await httpClient.post(API_ROUTES.dashboardLogout);
    clearAccessToken();
    queryClient.clear();
    window.location.assign(APP_ROUTES.reports);
  };
  return (
    <main className="workspace app-shell">
      <ReportsNavigation active="debts" />
      <section className="app-content">
        <header className="workspace__header">
          <div>
            <p className="eyebrow">Telebot</p>
            <h1>Công nợ</h1>
            <p className="muted">Khoản cần thu và cần trả đang mở</p>
          </div>
          <div className="header-status">
            <button onClick={refresh}>Làm mới</button>
            <button className="button--quiet" onClick={() => void logout()}>
              Đăng xuất
            </button>
          </div>
        </header>
        {debts.isError ? (
          <section className="inline-alert" role="alert">
            <strong>Không tải được công nợ</strong>
            <button onClick={refresh}>Thử lại</button>
          </section>
        ) : (
          <section className="content-grid content-grid--wide">
            <DataPanel
              title="Công nợ đang mở"
              description="Theo dõi từng khoản cần thu hoặc cần trả"
            >
              <DataTable
                ariaLabel="Danh sách công nợ"
                rows={debts.data ?? []}
                loading={debts.isLoading}
                emptyMessage="Không có công nợ đang mở"
                columns={debtColumns}
                getRowKey={(item) => item.id}
              />
            </DataPanel>
          </section>
        )}
      </section>
    </main>
  );
}

const debtColumns: DataTableColumn<IDebtListItem>[] = [
  {
    id: 'direction',
    header: 'Hướng',
    cell: (item) => (
      <span className="cell-primary">
        {item.direction === 'receivable' ? 'Cần thu' : 'Cần trả'}
      </span>
    ),
  },
  {
    id: 'counterparty',
    header: 'Người liên quan',
    cell: (item) => (
      <span className="cell-primary">
        {item.counterparty}
        {item.counterpartyAlias ? ` · ${item.counterpartyAlias}` : ''}
      </span>
    ),
  },
  {
    id: 'originalAmount',
    header: 'Ban đầu',
    align: 'right',
    cell: (item) => <span>{money(item.originalAmount)}</span>,
  },
  {
    id: 'remainingAmount',
    header: 'Còn lại',
    align: 'right',
    cell: (item) => <strong>{money(item.remainingAmount)}</strong>,
  },
  {
    id: 'dueAt',
    header: 'Hạn trả',
    cell: (item) => <span className="cell-muted">{date(item.dueAt)}</span>,
  },
  {
    id: 'note',
    header: 'Ghi chú',
    cell: (item) => <span className="cell-muted">{item.note || '—'}</span>,
  },
];
