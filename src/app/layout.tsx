import type { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ParticlesBackground from "@/components/ParticlesBackground";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${spaceMono.variable} antialiased min-h-screen bg-transparent text-foreground relative overflow-x-hidden scroll-pt-10`}
      >
        {/* Global particle background with higher z-index */}
        <div className="fixed inset-0 z-5 pointer-events-auto">
          <ParticlesBackground />
        </div>
        
        <Providers>
          {/* Main content container with transparent background */}
          <div className="relative z-10 bg-transparent">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
