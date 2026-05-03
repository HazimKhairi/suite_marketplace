import type { Metadata } from 'next';
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { Toaster } from 'sonner';
import { CartProvider } from '@/lib/cart';

const sans = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const display = Instrument_Serif({
  variable: '--font-display',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Suite Marketplace — Sukan UiTM Terengganu 2026',
  description:
    'Official jersey marketplace for the 5th Suite Games — UiTM Dungun, UiTM Kuala Terengganu, UiTM Bukit Besi.',
  metadataBase: new URL('https://suite-marketplace.vercel.app'),
  openGraph: {
    title: 'Suite Marketplace — Sukan UiTM Terengganu 2026',
    description: 'Official jerseys for the 5th Suite Games.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                borderRadius: 0,
                border: '1px solid var(--line)',
                background: 'var(--paper)',
                color: 'var(--ink)',
                fontFamily: 'var(--font-sans)',
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}
