import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SwiftRamadan - Elevate Your Ramadan",
  description: "Comprehensive Ramadan food delivery, group buying, logistics, and community platform for Lagos, Nigeria.",
  keywords: ["SwiftRamadan", "Ramadan", "Food Delivery", "Lagos", "Iftar", "Sahur", "Group Buy"],
  authors: [{ name: "SwiftRamadan Team" }],
  icons: {
    icon: "/swiftramadan-logo.png",
  },
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
