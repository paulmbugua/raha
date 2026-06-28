import type { Metadata } from 'next';
import RahaApp from '../components/raha/RahaApp';
import { buildFaqSchema, buildPageMetadata } from '../lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Raha | Premium Massage and Wellness Booking in Kenya',
  description: 'Find verified massage therapists, spas, and wellness professionals in Kenya. Book appointments, pay online, and unlock WhatsApp after confirmation.',
  path: '/',
  keywords: ['massage Kenya', 'spa booking Nairobi', 'wellness marketplace Kenya', 'M-Pesa massage booking'],
});

const faq = buildFaqSchema([
  { question: 'What is Raha?', answer: 'Raha is a premium Kenyan marketplace for verified massage therapists, spas, and wellness providers.' },
  { question: 'When can customers access WhatsApp?', answer: 'WhatsApp contact is unlocked after a booking is confirmed and paid.' },
  { question: 'How does Raha earn revenue?', answer: 'Providers pay monthly subscriptions, with premium plans unlocking featured placement and analytics.' },
]);

export default function Page() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} /><RahaApp /></>;
}
