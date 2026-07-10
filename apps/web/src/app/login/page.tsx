import type { Metadata } from 'next';
import LoginPage from '../../components/utamu/LoginPage';
import { buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Secret Nairobi | Login',
  description: 'Sign in to your Secret Nairobi account.',
  path: '/login',
});

export default function Page() {
  return <LoginPage />;
}
