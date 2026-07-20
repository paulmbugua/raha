import type { Metadata } from 'next';
import UtamuApp from '../components/utamu/UtamuApp';
import { buildFaqSchema, buildPageMetadata } from '../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Secret Nairobi | Verified Nairobi Escort Directory',
  description: 'Discover verified Nairobi escorts with curated profiles, VIP visibility, M-Pesa payments, reviews, messaging, verification workflows, and admin compliance.',
  path: '/',
  keywords: ['Secret Nairobi', 'Nairobi escort directory', 'verified escorts Kenya', 'M-Pesa booking', 'Nairobi escorts'],
});

const faq = buildFaqSchema([
  { question: 'What is Secret Nairobi?', answer: 'Secret Nairobi is a premium Kenyan directory for verified adult escorts and agency-managed profiles.' },
  { question: 'How does verification work?', answer: 'Applicants submit identity, selfie, portfolio, and payout details for admin review before receiving a verified badge.' },
  { question: 'How are payments handled?', answer: 'Secret Nairobi supports M-Pesa deposits for profile access and booking confirmation workflows.' },
]);

export default function Page() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} /><UtamuApp /></>;
}
