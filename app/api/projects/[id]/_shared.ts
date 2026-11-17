import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSiteAdmin } from '@/lib/admin';
import { isClientBriefRecord } from '@/lib/disco';
import { isInvited } from '@/lib/projects';
import { siteUrl } from '@/lib/site-url';

export async function loadProjectContext(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const { data: brief } = await admin
    .from('briefs')
    .select('id, brief_type, generated_content')
    .eq('id', id)
    .maybeSingle();
  const project = brief && isClientBriefRecord(brief) ? brief : null;
  const content = (project?.generated_content ?? {}) as Record<string, unknown>;
  const isAdmin = isSiteAdmin(user);
  return {
    user,
    admin,
    project,
    content,
    isAdmin,
    invited: isInvited(content, user?.id),
    name: (typeof content.projectTitle === 'string' && content.projectTitle) || (typeof content.codename === 'string' && content.codename) || 'your project',
    url: `${siteUrl()}/projects/${id}`,
  };
}

export async function displayName(admin: ReturnType<typeof createAdminClient>, userId: string, fallback = 'Composer') {
  const { data } = await admin.from('profiles').select('full_name, email').eq('id', userId).maybeSingle();
  const p = data as { full_name?: string | null; email?: string | null } | null;
  return { name: p?.full_name?.trim() || p?.email?.split('@')[0] || fallback, email: p?.email ?? null };
}
