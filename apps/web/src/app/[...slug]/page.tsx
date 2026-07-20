import type { Metadata } from 'next';
import UtamuApp from '../../components/utamu/UtamuApp';
import { buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Secret Nairobi App | Discovery, Profiles, Verification, Payments and Admin',
  description: 'Explore Secret Nairobi discovery, escort profiles, account dashboard, verification, M-Pesa checkout, reviews, notifications, and admin analytics.',
  path: '/',
});

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolved = await params;
  return <UtamuApp slug={resolved.slug} />;
}