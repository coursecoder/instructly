import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Providers } from '../components/providers';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Instructly - AI-Powered Instructional Design Platform',
  description: 'Transform instructional design from craft-based practice to evidence-based profession with AI-powered instructional design framework classification.',
  keywords: 'instructional design, AI, instructional frameworks, lesson planning, accessibility, WCAG',
  authors: [{ name: 'Instructly Team' }],
  robots: 'index, follow',
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>
          <div id="app" className="flex min-h-screen flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}