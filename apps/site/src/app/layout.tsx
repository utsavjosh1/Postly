import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { JobBotHeader } from "@/components/job-bot-header";
import { Footer } from "@/components/footer";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POSTLY - AI Job Discovery System | Coming Soon",
  description:
    "Automated job discovery for Discord communities. Smart AI matching, instant posting, seamless applications. Built for the modern job seeker.",
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
        <AuthProvider>
          <div className="min-h-screen bg-slate-950 overflow-x-hidden flex flex-col">
            <JobBotHeader />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
