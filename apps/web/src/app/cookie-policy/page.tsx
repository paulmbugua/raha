import type { Metadata } from 'next';
import UtamuApp from '../../components/utamu/UtamuApp';
import { buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Utamu | Verified Kenyan Model and Talent Directory',
  description: 'Utamu routes are served through the verified Kenyan model and talent directory experience.',
  path: '/',
});

export default function Page() {
  return <UtamuApp />;
}
