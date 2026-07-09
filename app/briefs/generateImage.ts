import type { SupabaseClient } from '@supabase/supabase-js';
import type { Brief } from './generate';

const ADMIN_USER_ID = '38ebaf6a-8f02-4e1f-a682-62039fb52756';

// Called during brief generation — auto-attaches image for admin briefs
export async function attachImageIfAdmin(
  brief: Brief,
  jobId: string,
  userId: string | null | undefined,
  admin: SupabaseClient
): Promise<void> {
  if (userId !== ADMIN_USER_ID) return;
  const url = await generateAndUpload(brief, `jobs/${jobId}/${Date.now()}.jpg`, admin);
  if (url) brief.imageUrl = url;
}

// Called from the regenerate endpoint — returns the new public URL
export async function generateImageForBrief(
  brief: Brief,
  briefId: string,
  admin: SupabaseClient
): Promise<string | null> {
  return generateAndUpload(brief, `briefs/${briefId}/${Date.now()}.jpg`, admin);
}

async function generateAndUpload(
  brief: Brief,
  storagePath: string,
  admin: SupabaseClient
): Promise<string | null> {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) { console.error('FAL_API_KEY not set'); return null; }

  try {
    const scene = (brief.story ?? brief.codename ?? 'a music composition scene').slice(0, 280);

    const prompt =
      `loose pen and ink sketch with soft watercolor wash, hand-drawn artistic illustration, ${scene}, ` +
      `fine ink line work and cross-hatching visible throughout, transparent watercolor washes in warm amber and burnt sienna, ` +
      `monochromatic warm orange-amber palette only, absolutely no blue no green no purple, ` +
      `warm peach and ochre tones, white sketchbook paper texture showing through the wash, ` +
      `painterly loose gestural marks, soft and delicate, not photorealistic, ink and watercolor on paper`;

    const falRes = await fetch('https://fal.run/fal-ai/flux/dev', {
      method: 'POST',
      headers: { Authorization: `Key ${falKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 35,
        guidance_scale: 3.5,
        num_images: 1,
      }),
    });

    if (!falRes.ok) {
      console.error('FAL /dev failed:', falRes.status, await falRes.text());
      return null;
    }

    const falData = await falRes.json() as { images?: { url: string }[] };
    const imgUrl = falData.images?.[0]?.url;
    if (!imgUrl) return null;

    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return null;
    const imgBuf = await imgRes.arrayBuffer();

    const { error: upErr } = await admin.storage
      .from('brief-images')
      .upload(storagePath, imgBuf, { contentType: 'image/jpeg', upsert: true });

    if (upErr) { console.error('Image upload failed:', upErr); return null; }

    const { data: { publicUrl } } = admin.storage
      .from('brief-images')
      .getPublicUrl(storagePath);

    return publicUrl;
  } catch (e) {
    console.error('Brief image generation error:', e);
    return null;
  }
}
