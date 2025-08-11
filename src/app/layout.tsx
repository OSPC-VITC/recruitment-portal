import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ParticlesBackgroundWrapper from "@/components/ParticlesBackgroundWrapper";

// Optimize font loading with display swap
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "OSPC Recruitment Portal",
  description: "Join the Open Source Programming Club - Apply for tech, design, and marketing roles",
  keywords: ["OSPC", "recruitment", "club", "tech", "design", "marketing"],
  icons: {
    icon: [
      {
        url: "/images/ospc_logo.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/images/ospc_logo.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: {
      url: "/images/ospc_logo.png",
      sizes: "180x180",
      type: "image/png",
    },
    shortcut: "/images/ospc_logo.png",
  },
};

// Add resource hints for better performance
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preload critical assets */}
        <link
          rel="preload"
          href="/images/ospc_logo.png"
          as="image"
          type="image/png"
        />
        {/* Add preconnect and dns-prefetch hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />

        {/* Improve chunk loading reliability */}
        <link rel="dns-prefetch" href="/_next/" />
        <link rel="preconnect" href="/_next/" />

        {/* Add meta tags for better error handling */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body
        className={`${spaceMono.variable} antialiased min-h-screen bg-transparent text-foreground relative overflow-x-hidden scroll-pt-10`}
      >
        {/* Global particle background with higher z-index */}
        <ParticlesBackgroundWrapper />
        
        <Providers>
          {/* Main content container with transparent background */}
          <div className="relative z-10 bg-transparent">
            {children}
          </div>
        </Providers>

        {/* Service Worker Registration Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                'use strict';

                function registerServiceWorker() {
                  if ('serviceWorker' in navigator && typeof window !== 'undefined') {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  }
                }

                if (document.readyState === 'loading') {
                  window.addEventListener('load', registerServiceWorker);
                } else {
                  registerServiceWorker();
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
