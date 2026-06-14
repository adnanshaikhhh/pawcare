import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

const display = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'PawCare — Every pet. Every moment. Every detail.',
  description: 'Track health, get reminders, and never miss a vet visit for every cat and dog in your family.',
  applicationName: 'PawCare',
  keywords: ['pet care', 'vet', 'cat', 'dog', 'reminders', 'family', 'health tracking'],
  authors: [{ name: 'PawCare' }],
  openGraph: {
    title: 'PawCare — Every pet. Every moment. Every detail.',
    description: 'Premium pet parent companion app and web platform.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FF6B6B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: { borderRadius: '12px', background: '#1C1C1E', color: '#fff', fontSize: '14px' },
          }}
        />
      </body>
    </html>
  );
}
