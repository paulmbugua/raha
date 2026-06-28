import type { Metadata } from 'next';
import RahaApp from '../../components/raha/RahaApp';
import { buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Raha App | Wellness Marketplace Routes',
  description: 'Explore Raha customer, provider, booking, checkout, wallet, subscription, review, and admin screens.',
  path: '/',
});

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolved = await params;
  return <RahaApp slug={resolved.slug} />;
}