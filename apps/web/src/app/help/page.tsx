import type { Metadata } from 'next';
import UtamuApp from '../../components/utamu/UtamuApp';
import { buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact Secret Nairobi | Support',
  description: 'Contact Secret Nairobi support for account, payment, verification, profile, safety, and platform help.',
  path: '/help',
});

export default function Page() {
  return <UtamuApp slug={['help']} />;
}
