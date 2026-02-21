import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import Footer from "@/components/Footer";
import Link from "next/link";
import { CreditCard, History, Home } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aderoute | M-Pesa Payments",
  description: "Simple M-Pesa STK Push payment demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>
          {/* Header - beautifully translucent with subtle blur */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-white/20 backdrop-blur-md border-b border-white/30 shadow-sm">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 sm:h-20">
                {/* Brand - Aderoute with home link */}
                <Link href="/" className="flex items-center space-x-2 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500 rounded-lg blur-md opacity-0 group-hover:opacity-30 transition-opacity" />
                    <div className="relative bg-linear-to-br from-green-500 to-green-600 p-2 rounded-lg shadow-md group-hover:shadow-lg transition-all">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    {/* Aderoute in Orange */}
                    <span className="text-xl sm:text-2xl font-bold text-orange-500 drop-shadow-sm">
                      Aderoute
                    </span>
                    {/* Secure Payments in Green */}
                    <span className="text-xs text-green-600 drop-shadow-sm hidden sm:block">
                      Secure Payments
                    </span>
                  </div>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center space-x-2">
                  {/* Home Icon - Green */}
                  <Link
                    href="/"
                    className="p-2.5 text-green-600 hover:text-orange-500 rounded-full hover:bg-white/30 transition-all duration-200"
                    aria-label="Home"
                  >
                    <Home className="w-5 h-5 drop-shadow-sm" />
                  </Link>

                  {/* History Button - Orange theme */}
                  <Link
                    href="/history"
                    className="flex items-center space-x-2 px-4 py-2 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <History className="w-4 h-4" />
                    <span className="font-medium">History</span>
                  </Link>
                </nav>
              </div>
            </div>
          </header>

          {/* Spacer to prevent content from hiding under fixed header */}
          <div className="h-16 sm:h-20" />

          {/* Main Content */}
          <div className="relative min-h-[calc(100vh-8rem)]">{children}</div>

          {/* Footer */}
          <Footer />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
