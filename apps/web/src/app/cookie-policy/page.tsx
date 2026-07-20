import type { Metadata } from 'next';
import UtamuApp from '../../components/utamu/UtamuApp';
import { buildPageMetadata } from '../../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Secret Nairobi | Verified Nairobi Escort Directory',
  description: 'Secret Nairobi routes are served through the verified Nairobi escort directory experience.',
  path: '/',
});

export default function Page() {
  return <UtamuApp />;
}
