'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type Mode = 'brand' | 'film' | 'games';

interface SaveBriefInput {
  mode: Mode;
  target: string;
  genres: string[];
  moods: string[];
  generatedContent: Record<string, unknown>;
}

export async function saveBrief(input: SaveBriefInput) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in to save briefs.' };
  }

  const { data, error } = await supabase
    .from('briefs')
    .insert({
      user_id: user.id,
      mode: input.mode,
      target: input.target,
      genres: input.genres,
      moods: input.moods,
      generated_content: input.generatedContent,
      status: 'saved',
    })
    .select()
    .single();

  if (error) {
    console.error('Save brief error:', error);
    return { error: 'Could not save brief. Please try again.' };
  }

  revalidatePath('/account');
  return { success: true, briefId: data.id };
}
export async function deleteBrief(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const briefId = formData.get('briefId') as string;

  if (!briefId) {
    redirect('/library');
  }

  const { error } = await supabase
    .from('briefs')
    .delete()
    .eq('id', briefId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Delete brief error:', error);
  }

  revalidatePath('/library');
  redirect('/library');
}