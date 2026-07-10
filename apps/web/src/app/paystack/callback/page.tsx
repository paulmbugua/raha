import type { Metadata } from 'next';
import PaystackCallbackPage from '../../../components/utamu/PaystackCallbackPage';
import { buildPageMetadata } from '../../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Payment Confirmation | Secret Nairobi',
  description: 'Confirm Paystack payment and activate VIP visibility.',
  path: '/paystack/callback',
});

export default function Page() {
  return <PaystackCallbackPage />;
}
