import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/layout/BottomNav";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gym Buddy - Fitness Tracker",
  description: "Track your workouts, build routines, and monitor your progress",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#0D1117', margin: 0, padding: 0 }}>
        <AuthProvider>
            <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
            <main style={{ paddingBottom: 90 }}>
                {children}
            </main>
            </div>
            <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
