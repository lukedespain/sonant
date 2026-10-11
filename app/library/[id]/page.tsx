import { redirect } from 'next/navigation';

export default async function LibraryBriefRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/briefs/${id}`);
}
