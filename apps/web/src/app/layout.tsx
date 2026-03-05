import type { Metadata } from 'next';
import { Bebas_Neue, Libre_Baskerville, Karla, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const libreBaskerville = Libre_Baskerville({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-libre',
  display: 'swap',
});

const karla = Karla({
  subsets: ['latin'],
  variable: '--font-karla',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'StaffPicks — Your friends work here.',
    template: '%s | StaffPicks',
  },
  description:
    'Track everything you watch. Share it with friends. StaffPicks is the social video tracker for the streaming age.',
  keywords: ['movie tracker', 'tv show tracker', 'watch list', 'social movie app', 'what to watch'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mystaffpicks.com',
    siteName: 'StaffPicks',
    title: 'StaffPicks — Your friends work here.',
    description:
      'Track everything you watch. Share it with friends. Your friends are the algorithm.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StaffPicks — Your friends work here.',
    description: 'Track everything you watch. Share it with friends.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bebasNeue.variable} ${libreBaskerville.variable} ${karla.variable} ${ibmPlexMono.variable} font-sans bg-background text-cream antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
