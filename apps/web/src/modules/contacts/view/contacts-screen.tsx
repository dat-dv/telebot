'use client';

import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { API_ROUTES, type IContactListItem } from '@telebot/contracts';
import { clearAccessToken } from '@/modules/auth/client/auth-storage';
import { httpClient } from '@/shared/api/http-client';
import { DataPanel, DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { contactsQueryKeys, useContactsQuery } from '../api/contacts-query';

const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(value),
      )
    : 'Chưa đặt';

export function ContactsScreen() {
  const queryClient = useQueryClient();
  const contacts = useContactsQuery();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: contactsQueryKeys.list() });
  const logout = async () => {
    await httpClient.post(API_ROUTES.dashboardLogout);
    clearAccessToken();
    queryClient.clear();
    window.location.assign('/reports/');
  };
  return (
    <main className="workspace app-shell">
      <aside className="app-nav" aria-label="Điều hướng dashboard">
        <div className="app-nav__brand">
          <span>Telebot</span>
          <small>Cá nhân</small>
        </div>
        <nav>
          <NavLink href="/reports/" label="Trang chủ" />
          <NavLink href="/reports/statistics/" label="Thống kê" />
          <NavLink active href="/reports/contacts/" label="Liên lạc" />
        </nav>
      </aside>
      <section className="app-content">
        <header className="workspace__header">
          <div>
            <p className="eyebrow">Telebot</p>
            <h1>Liên lạc</h1>
            <p className="muted">Danh bạ công nợ của bạn</p>
          </div>
          <div className="header-status">
            <button onClick={refresh}>Làm mới</button>
            <button className="button--quiet" onClick={() => void logout()}>
              Đăng xuất
            </button>
          </div>
        </header>
        {contacts.isError ? (
          <section className="inline-alert" role="alert">
            <strong>Không tải được danh bạ</strong>
            <span>Hãy làm mới trang hoặc mở lại từ bot.</span>
          </section>
        ) : (
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
        )}
      </section>
    </main>
  );
}

function NavLink({
  active = false,
  href,
  label,
}: {
  active?: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      className={active ? 'app-nav__item is-active' : 'app-nav__item'}
      aria-current={active ? 'page' : undefined}
      href={href}
    >
      {label}
    </Link>
  );
}

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
