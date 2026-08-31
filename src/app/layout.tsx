import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "../kingdom-ui/lib/kingdom.css";
import { Toaster } from "@/components/ui/toaster";
import PWARegister from "@/components/PWARegister";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "SwiftRamadan — Smart Kitchen & Halal Delivery",
    template: "%s | SwiftRamadan",
  },
  description:
    "Order iftar meals, groceries, and more in Lagos. Deliver before Maghrib. AI-powered meal planning, SwiftReels food shorts, and Ramadan essentials.",
  keywords: [
    "Ramadan",
    "Iftar",
    "Sahur",
    "Halal food",
    "Lagos delivery",
    "Jollof rice",
    "Suya",
    "Dates",
    "Groceries",
    "Nigeria",
  ],
  authors: [{ name: "SwiftRamadan" }],
  creator: "SwiftRamadan",
  publisher: "SwiftRamadan",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SwiftRamadan — Smart Kitchen & Halal Delivery",
    description:
      "Order iftar meals, groceries, and more in Lagos. Deliver before Maghrib.",
    url: "/",
    siteName: "SwiftRamadan",
    type: "website",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "SwiftRamadan — Smart Kitchen & Halal Delivery",
    description:
      "Order iftar meals, groceries, and more in Lagos. Deliver before Maghrib.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#10E07A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body
        className={`${plusJakarta.variable} antialiased bg-[#05070A] text-white font-sans`}
      >
        <PWARegister />
        <ErrorBoundary>{children}</ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
