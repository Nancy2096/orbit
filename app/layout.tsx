import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'AgencyHub - Sistema de Gestión Multiagencia',
  description: 'Sistema integral para gestión de agencias de marketing',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var ro = window.onerror;
                window.onerror = function(m) {
                  if (m && typeof m === 'string' && m.indexOf('ResizeObserver') > -1) return true;
                  return ro ? ro.apply(this, arguments) : false;
                };
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.indexOf('ResizeObserver') > -1) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);
                var resizeObserverErr = window.ResizeObserver;
                if (resizeObserverErr) {
                  window.ResizeObserver = function(callback) {
                    return new resizeObserverErr(function(entries, observer) {
                      window.requestAnimationFrame(function() {
                        try { callback(entries, observer); } catch(e) {}
                      });
                    });
                  };
                  window.ResizeObserver.prototype = resizeObserverErr.prototype;
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
