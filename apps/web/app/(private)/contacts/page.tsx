import type { Metadata } from 'next';
import { ContactsScreen } from '@/modules/contacts/view/contacts-screen';

export const metadata: Metadata = {
  title: 'Người liên quan',
  description: 'Danh bạ những người có giao dịch vay, cho vay hoặc thu chi với bạn.',
};

export default function ContactsPage() {
  return <ContactsScreen />;
}
