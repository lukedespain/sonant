import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
// import AudioPlayerBar from "@/components/AudioPlayerBar";
import { Providers } from "./providers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sonant",
  description: "Practice writing to briefs. Get feedback. Build a sync catalog worth pitching.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const accountType = (user?.user_metadata?.account_type as 'composer' | 'business') ?? 'composer';

  let submissionCredits = 0;
  let sessionCredits = 0;

  if (user && accountType === 'composer') {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('submission_credits, session_credits')
      .eq('id', user.id)
      .single();
    submissionCredits = (profile as any)?.submission_credits ?? 0;
    sessionCredits = (profile as any)?.session_credits ?? 0;
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Nav
            user={user}
            accountType={user ? accountType : null}
            submissionCredits={submissionCredits}
            sessionCredits={sessionCredits}
          />
          {children}
          {/* Audio player hidden. Keep AudioPlayerBar.tsx and AudioPlayerContext to restore later. */}
          {/* <AudioPlayerBar /> */}
        </Providers>
      </body>
    </html>
  );
}
