import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Orbit',
  description: 'Sistema integral para gestión de agencias de marketing',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/orbit.png',
        type: 'image/png',
      },
    ],
    apple: '/orbit.png',
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
                var RO_MSG = 'ResizeObserver loop';
                var isRO = function(v) {
                  return v && typeof v === 'string' && v.indexOf('ResizeObserver') > -1;
                };

                // 1) Swallow classic error handlers
                var ro = window.onerror;
                window.onerror = function(m) {
                  if (isRO(m)) return true;
                  return ro ? ro.apply(this, arguments) : false;
                };
                window.addEventListener('error', function(e) {
                  if (isRO(e && e.message)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);

                // 2) Swallow unhandled promise rejections carrying the message
                window.addEventListener('unhandledrejection', function(e) {
                  var reason = e && e.reason;
                  var msg = reason && (reason.message || reason);
                  if (isRO(msg)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return true;
                  }
                }, true);

                // 3) Filter console.error (Next.js dev overlay reads from here)
                var origConsoleError = window.console && window.console.error;
                if (origConsoleError) {
                  window.console.error = function() {
                    var first = arguments[0];
                    var text = isRO(first) ? first
                      : (first && isRO(first.message) ? first.message : '');
                    if (isRO(text)) return;
                    return origConsoleError.apply(this, arguments);
                  };
                }

                // 4) Debounce ResizeObserver callbacks to avoid the loop entirely
                var NativeRO = window.ResizeObserver;
                if (NativeRO) {
                  window.ResizeObserver = function(callback) {
                    return new NativeRO(function(entries, observer) {
                      window.requestAnimationFrame(function() {
                        try { callback(entries, observer); } catch(e) {}
                      });
                    });
                  };
                  window.ResizeObserver.prototype = NativeRO.prototype;
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
