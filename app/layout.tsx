import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import AudioPlayerBar from "@/components/AudioPlayerBar";
import Footer from "@/components/Footer";
import { Providers } from "./providers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSiteAdmin } from "@/lib/admin";
import { ensureMonthlySubmissionCredit } from "@/lib/monthly-credit";


// Preview build: keep it out of search until the Thought Collective cutover.
export const metadata: Metadata = {
  title: "Thought Collective · Composers",
  description: "Briefs from Thought Collective, a London music and sound company. Write to spec, get written feedback, and get your best tracks into the catalogue.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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

  if (user) {
    try {
      await ensureMonthlySubmissionCredit(createAdminClient(), user);
    } catch (error) {
      console.error('Monthly credit check failed', error);
    }
  }

  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..700;1,14..32,300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-clip">
        <Providers>
          <Nav
            user={user}
            isSiteAdmin={isSiteAdmin(user)}
          />
          {children}
          <Footer />
          <AudioPlayerBar />
        </Providers>
      </body>
    </html>
  );
}
