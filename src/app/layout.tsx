import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/theme-context";
import { ToastProvider } from "@/contexts/toast-context";
import { PremiumProvider } from "@/contexts/premium-context";
import { UserSettingsProvider } from "@/contexts/user-settings-context";
import { Footer } from "@/components/ui/footer";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ThemeEnforcer } from "@/components/ui/theme-enforcer";

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
        {/* Early theme application to avoid flash and forced dark */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(){try{var t=localStorage.getItem('theme');var r=document.documentElement;if(t==='dark'){r.classList.add('dark');r.style.colorScheme='dark';}else{r.classList.remove('dark');r.style.colorScheme='light';}}catch(e){}}();`,
          }}
        />
        <ThemeProvider>
          <ToastProvider>
            <PremiumProvider>
              <UserSettingsProvider>
                <div className="min-h-screen flex flex-col">
                  <ThemeEnforcer />
                  {children}
                  <ThemeToggle />
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
