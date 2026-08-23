'use client';

import { useQueryClient } from '@tanstack/react-query';
import { API_ROUTES, APP_ROUTES, type IExpenseListItem } from '@telebot/contracts';
import { clearAccessToken } from '@/modules/auth/client/auth-storage';
import { httpClient } from '@/shared/api/http-client';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { ReportsNavigation } from '@/shared/ui/reports-navigation';
import { expensesQueryKeys, useExpensesQuery } from '../api/expenses-query';

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
const date = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  );

export function ExpensesScreen() {
  const queryClient = useQueryClient();
  const expenses = useExpensesQuery();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: expensesQueryKeys.list() });
  const logout = async () => {
    await httpClient.post(API_ROUTES.dashboardLogout);
    clearAccessToken();
    queryClient.clear();
    window.location.assign(APP_ROUTES.reports);
  };
  return (
    <main className="workspace workspace--full app-shell">
      <ReportsNavigation active="expenses" />
      <section className="app-content">
        <header className="workspace__header">
          <div>
            <p className="eyebrow">Telebot</p>
            <h1>Khoản chi</h1>
            <p className="muted">Lịch sử các giao dịch chi gần đây</p>
          </div>
          <div className="header-status">
            <button onClick={refresh}>Làm mới</button>
            <button className="button--quiet" onClick={() => void logout()}>
              Đăng xuất
            </button>
          </div>
        </header>
        {expenses.isError ? (
          <section className="inline-alert" role="alert">
            <strong>Không tải được khoản chi</strong>
            <button onClick={refresh}>Thử lại</button>
          </section>
        ) : (
          <section className="content-grid content-grid--wide">
            <DataPanel title="Lịch sử khoản chi" description="Tối đa 200 giao dịch mới nhất">
              <DataTable
                ariaLabel="Danh sách khoản chi"
                rows={expenses.data ?? []}
                loading={expenses.isLoading}
                emptyMessage="Chưa có khoản chi"
                columns={expenseColumns}
                getRowKey={(item) => item.id}
              />
            </DataPanel>
          </section>
        )}
      </section>
    </main>
  );
}

const expenseColumns: DataTableColumn<IExpenseListItem>[] = [
  {
    id: 'category',
    header: 'Danh mục',
    cell: (item) => <span className="cell-primary">{item.category}</span>,
  },
  {
    id: 'note',
    header: 'Nội dung chi',
    cell: (item) => <span className="cell-muted">{item.note || '—'}</span>,
  },
  {
    id: 'amount',
    header: 'Số tiền',
    align: 'right',
    cell: (item) => <strong>{money(item.amount)}</strong>,
  },
  {
    id: 'occurredAt',
    header: 'Phát sinh',
    cell: (item) => <span className="cell-muted">{date(item.occurredAt)}</span>,
  },
];
