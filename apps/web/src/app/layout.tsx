import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Instructly - AI-Powered Instructional Design Platform',
  description: 'Transform instructional design from craft-based practice to evidence-based profession with AI-powered Clark & Mayer framework classification.',
  keywords: 'instructional design, AI, Clark & Mayer, lesson planning, accessibility, WCAG',
  authors: [{ name: 'Instructly Team' }],
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  manifest: '/manifest.json',
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
        <div id="app" className="flex min-h-screen flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}