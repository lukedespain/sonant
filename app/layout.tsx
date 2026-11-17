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
import { readHandoffs } from "@/lib/handoff";
import SiteFrame from "@/components/shell/SiteFrame";
import type { ShellData } from "@/components/shell/AppShell";


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

  const isAdmin = isSiteAdmin(user);
  const shell: ShellData = {
    signedIn: !!user,
    isAdmin,
    name: '',
    email: user?.email ?? '',
    credits: null,
    daysUntilNextCredit: null,
    offersWaiting: 0,
    reviewQueue: 0,
  };

  if (user) {
    const admin = createAdminClient();
    try {
      const monthly = await ensureMonthlySubmissionCredit(admin, user);
      shell.credits = monthly?.credits ?? null;
      shell.daysUntilNextCredit = monthly?.daysUntilNext ?? null;
    } catch (error) {
      console.error('Monthly credit check failed', error);
    }
    const [{ data: profile }, queue] = await Promise.all([
      admin.from('profiles').select('full_name, submission_credits').eq('id', user.id).maybeSingle(),
      isAdmin
        ? admin.from('submissions').select('id', { count: 'exact', head: true }).in('status', ['received', 'pending', 'in_review'])
        : Promise.resolve({ count: 0 }),
    ]);
    const p = profile as { full_name?: string | null; submission_credits?: number | null } | null;
    shell.name = p?.full_name?.trim() ?? '';
    if (shell.credits == null && typeof p?.submission_credits === 'number') shell.credits = p.submission_credits;
    shell.offersWaiting = Object.values(readHandoffs(user.app_metadata)).filter((h) => h.offeredAt && !h.agreedAt).length;
    shell.reviewQueue = queue.count ?? 0;
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
          <SiteFrame shell={shell} nav={<Nav user={user} isSiteAdmin={isAdmin} />} footer={<Footer />}>
            {children}
          </SiteFrame>
          <AudioPlayerBar />
        </Providers>
      </body>
    </html>
  );
}
