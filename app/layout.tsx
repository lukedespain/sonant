import type { Metadata, Viewport } from "next";
import "./globals.css";
import AudioPlayerBar from "@/components/AudioPlayerBar";
import { Providers } from "./providers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSiteAdmin } from "@/lib/admin";
import { isAdminView } from "@/lib/admin-view";
import { readHandoffs } from "@/lib/handoff";
import { loadProjects, readThread, unreadFor } from "@/lib/projects";
import SiteFrame from "@/components/shell/SiteFrame";
import type { ShellData } from "@/components/shell/AppShell";


// Preview build: keep it out of search until the Thought Collective cutover.
export const metadata: Metadata = {
  title: "Thought Collective · Composers",
  description: "Briefs from Thought Collective, a London music and sound company. Write to spec and get your best tracks into the catalogue.",
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

  const realAdmin = isSiteAdmin(user);
  const isAdmin = await isAdminView(user);
  const shell: ShellData = {
    signedIn: !!user,
    isAdmin,
    canSwitchView: realAdmin,
    name: '',
    email: user?.email ?? '',
    offersWaiting: 0,
    reviewQueue: 0,
    projectUnread: 0,
  };

  if (user) {
    const admin = createAdminClient();
    const [{ data: profile }, queue] = await Promise.all([
      admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      isAdmin
        ? admin.from('submissions').select('brief_id').in('status', ['received', 'pending', 'in_review'])
        : Promise.resolve({ data: [] }),
    ]);
    const p = profile as { full_name?: string | null } | null;
    shell.name = p?.full_name?.trim() ?? '';
    shell.offersWaiting = Object.values(readHandoffs(user.app_metadata)).filter((h) => h.offeredAt && !h.agreedAt).length;
    // The review queue is catalogue submissions; project uploads live on each project.
    const pending = ((queue.data ?? []) as { brief_id: string }[]).map((r) => r.brief_id);
    if (pending.length) {
      const { data: clientBriefs } = await admin
        .from('briefs')
        .select('id')
        .in('id', [...new Set(pending)])
        .eq('brief_type', 'client');
      const client = new Set(((clientBriefs ?? []) as { id: string }[]).map((b) => b.id));
      shell.reviewQueue = pending.filter((id) => !client.has(id)).length;
    }
    try {
      const projects = (await loadProjects(admin, isAdmin ? undefined : user.id)).filter((p) => !p.closed);
      const counts = await Promise.all(
        projects.flatMap((p) =>
          isAdmin
            ? p.invites.map(async (i) => unreadFor(await readThread(admin, p.id, i.composerId), 'admin'))
            : [readThread(admin, p.id, user.id).then((t) => unreadFor(t, 'composer'))],
        ),
      );
      shell.projectUnread = counts.reduce((a, b) => a + b, 0);
    } catch (error) {
      console.error('Project unread count failed', error);
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
          <SiteFrame shell={shell}>
            {children}
          </SiteFrame>
          <AudioPlayerBar />
        </Providers>
      </body>
    </html>
  );
}
