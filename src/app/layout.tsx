import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { NetworkStatus } from '@/components/ui/network-status'
import { AppProviders } from '@/lib/mobile'
import { PerformanceProvider } from '@/hooks/usePerformanceMode'
import { getBranding, buildThemeCss } from '@/lib/branding'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Ezy ERP',
    template: '%s | Ezy ERP',
  },
  description: 'نظام إدارة متكامل للأعمال التجارية',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-touch-fullscreen': 'yes',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const branding = await getBranding()
  const themeCss = buildThemeCss(branding)

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        {branding.logo_url && <link rel="icon" href={branding.logo_url} />}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${cairo.variable} font-sans antialiased mobile-text-fix`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <PerformanceProvider>
            <AppProviders>{children}</AppProviders>
            <Toaster />
            <NetworkStatus />
            <div id="sr-announcer" role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
          </PerformanceProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
