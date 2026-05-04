import type { Metadata } from 'next';
import { Inter, Montserrat, Open_Sans, Lato, Roboto } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { Toaster } from 'sonner';
import { CartProvider } from '@/lib/cart';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const montserrat = Montserrat({
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
});

const openSans = Open_Sans({
  variable: '--font-open-sans',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const lato = Lato({
  variable: '--font-lato',
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const roboto = Roboto({
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Suite Games 2026 / UiTM Kuala Terengganu',
  description:
    'Official kit drop for UiTM Kuala Terengganu athletes. Custom jerseys with name and number, plus a track jacket only available for SUITE\'s athletes. Suite Games 11.12.13 June 2026.',
  metadataBase: new URL('https://suite-marketplace.vercel.app'),
  openGraph: {
    title: 'Suite Games 2026 / UiTM Kuala Terengganu',
    description:
      'Official kit drop for UiTM KT athletes — custom jerseys and a track jacket only available for SUITE\'s athletes.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable} ${openSans.variable} ${lato.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink overflow-x-clip">
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
                fontFamily: 'var(--font-inter)',
              },
            }}
          />
        </CartProvider>
      </body>
    </html>
  );
}
