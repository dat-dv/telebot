import type { Metadata } from 'next';
import { PlacesScreen } from '@/modules/dashboard/view/places-screen';

export const metadata: Metadata = {
  title: 'Nơi chốn & Địa điểm',
  description: 'Quản lý danh sách các cửa hàng, quán ăn, bệnh viện và địa điểm thu chi của bạn.',
};

export default function PlacesPage() {
  return <PlacesScreen />;
}
