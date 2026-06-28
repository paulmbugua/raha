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
    title: 'Raha | Elite Wellness Kenya',
    description:
      'Kenya premium marketplace for verified massage therapists, spas, and wellness professionals.',
    path: '/',
    keywords: ['massage Kenya', 'spa booking Kenya', 'wellness marketplace', 'Raha'],
  }),
  applicationName: 'Raha',
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
        var stored = localStorage.getItem('raha-theme') || localStorage.getItem('mindcare-theme');
        var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        var theme = stored === 'light' || stored === 'dark' ? stored : (systemDark ? 'dark' : 'light');
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