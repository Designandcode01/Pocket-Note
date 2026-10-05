import type { Metadata, Viewport } from 'next'
import PwaClient from './pwa-client'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pocket Notes',
  description: 'Quick notes that work offline.',
  applicationName: 'Pocket Notes',
  appleWebApp: { capable: true, title: 'Notes', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PwaClient />
        {children}
      </body>
    </html>
  )
}
