import type { Metadata } from 'next';
import '../index.css';
import Providers from './providers';
import {
  buildOrganizationSchema,
  buildPageMetadata,
  buildWebsiteSchema,
  getSiteUrl,
} from '../lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  ...buildPageMetadata({
    title: 'Utamu | Verified Kenyan Model and Talent Directory',
    description:
      'Premium dark-elegance directory for verified Kenyan models, talent bookings, M-Pesa deposits, reviews, and admin compliance.',
    path: '/',
    keywords: ['Utamu', 'Kenyan models', 'verified talent', 'M-Pesa booking', 'model directory'],
  }),
  applicationName: 'Utamu',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeInitScript = `
    (function () {
      try {
        var stored = localStorage.getItem('utamu-theme') || localStorage.getItem('raha-theme') || localStorage.getItem('mindcare-theme');
        var theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
        document.documentElement.classList.toggle('dark', theme === 'dark');
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebsiteSchema()) }}
        />
      </head>
      <body className="app-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
