import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { DeferredHotToastProvider } from "@/components/providers/deferred-hot-toast-provider";
import { ServiceWorkerRegistration } from "@/components/providers/service-worker-registration";
import { UtmTracker } from "@/components/providers/utm-tracker";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/lib/site-content";
import "react-datepicker/dist/react-datepicker.css";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: "Wedding Vendor Backup SaaS",
  description: siteConfig.description,
  applicationName: siteConfig.name,
  manifest: "/manifest.webmanifest",
  keywords: [
    "wedding vendor backup",
    "wedding planner SaaS",
    "vendor no-show prevention",
    "AI wedding backup",
    "event vendor insurance",
  ],
  openGraph: {
    title: "Wedding Vendor Backup SaaS",
    description: siteConfig.description,
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Wedding Shadow Book landing page preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding Vendor Backup SaaS",
    description: siteConfig.description,
    images: ["/og-image.svg"],
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7f6" },
    { media: "(prefers-color-scheme: dark)", color: "#150f16" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${siteConfig.gaMeasurementId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${siteConfig.gaMeasurementId}');
          `}
        </Script>
      </head>
      <body
        className={`${manrope.variable} ${cormorant.variable} bg-background text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ServiceWorkerRegistration />
          <UtmTracker />
          <DeferredHotToastProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}