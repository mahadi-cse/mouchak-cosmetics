import { redirect } from 'next/navigation';

export default function MyOrdersPage() {
  redirect('/dashboard?tab=order');
}