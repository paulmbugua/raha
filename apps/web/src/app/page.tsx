import type { Metadata } from 'next';
import UtamuApp from '../components/utamu/UtamuApp';
import { buildFaqSchema, buildPageMetadata } from '../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Utamu | Verified Kenyan Model and Talent Directory',
  description: 'Discover verified Kenyan models and wellness talent with curated profiles, M-Pesa deposits, reviews, verification workflows, and admin compliance.',
  path: '/',
  keywords: ['Utamu', 'Kenyan model directory', 'verified talent Kenya', 'M-Pesa booking', 'Nairobi models'],
});

const faq = buildFaqSchema([
  { question: 'What is Utamu?', answer: 'Utamu is a premium Kenyan directory for verified professional models and wellness talent.' },
  { question: 'How does verification work?', answer: 'Applicants submit identity, selfie, portfolio, and payout details for admin review before receiving a verified badge.' },
  { question: 'How are payments handled?', answer: 'Utamu supports M-Pesa deposits for profile access and booking confirmation workflows.' },
]);

export default function Page() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} /><UtamuApp /></>;
}
