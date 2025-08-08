import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/theme-context";
import { ToastProvider } from "@/contexts/toast-context";
import { PremiumProvider } from "@/contexts/premium-context";
import { UserSettingsProvider } from "@/contexts/user-settings-context";
import { Footer } from "@/components/ui/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FuelMeter - Aplikasi Pencatatan Bahan Bakar",
  description: "Aplikasi web untuk mencatat dan mengelola data pengisian bahan bakar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ToastProvider>
            <PremiumProvider>
              <UserSettingsProvider>
                <div className="min-h-screen flex flex-col">
                  {children}
                  <Footer />
                </div>
              </UserSettingsProvider>
            </PremiumProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
