import type { Metadata } from 'next';
import { SettingsScreen } from '@/modules/settings/view/settings-screen';

export const metadata: Metadata = {
  title: 'Cài đặt',
  description: 'Quản lý danh mục thu chi và cấu hình hệ thống cá nhân.',
};

export default function SettingsPage() {
  return <SettingsScreen />;
}
