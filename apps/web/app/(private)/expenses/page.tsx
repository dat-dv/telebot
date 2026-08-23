import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@telebot/contracts';

export default function ExpensesRedirectPage() {
  redirect(`${APP_ROUTES.transactions}?type=expense`);
}
