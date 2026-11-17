'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { btn } from '@/components/ui';
import type { Sound } from '@/lib/sound';

function Chips({
  label,
  options,
  value,
  onToggle,
}: {
  label: string;
  options: string[];
  value: string[];
  onToggle: (tag: string) => void;
}) {
  const on = new Set(value.map((v) => v.toLowerCase()));
  return (
    <fieldset className="border-0 p-0 m-0">
      <legend className="text-[13px] text-[var(--text-muted)] mb-2.5">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((tag) => {
          const active = on.has(tag.toLowerCase());
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(tag)}
              className={`h-8 px-3 rounded-full text-[13px] border transition-colors ${
                active
                  ? 'bg-[var(--accent)] text-[#0A0A0A] border-[var(--accent)] font-medium'
                  : 'border-[var(--border-card)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Pick the genres and moods you usually write. Briefs sorts a For you view by it. */
export default function SoundPicker({
  initial,
  genreOptions,
  moodOptions,
}: {
  initial: Sound;
  genreOptions: string[];
  moodOptions: string[];
}) {
  const router = useRouter();
  const [sound, setSound] = useState(initial);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const toggle = (key: 'genres' | 'moods') => (tag: string) => {
    setState('idle');
    setSound((cur) => {
      const has = cur[key].some((t) => t.toLowerCase() === tag.toLowerCase());
      return { ...cur, [key]: has ? cur[key].filter((t) => t.toLowerCase() !== tag.toLowerCase()) : [...cur[key], tag].slice(0, 12) };
    });
  };

  async function save() {
    setState('saving');
    const res = await fetch('/api/profile/sound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sound),
    });
    setState(res.ok ? 'saved' : 'error');
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Chips label="Genres" options={genreOptions} value={sound.genres} onToggle={toggle('genres')} />
      <Chips label="Moods" options={moodOptions} value={sound.moods} onToggle={toggle('moods')} />
      <div className="pt-5 border-t border-[var(--border-base)] flex items-center gap-4">
        <button type="button" onClick={save} disabled={state === 'saving'} className={btn('primary', 'md')}>
          {state === 'saving' ? 'Saving…' : 'Save my sound'}
        </button>
        {state === 'saved' && <span className="text-[13px] text-[var(--positive)]">Saved. Briefs now sorts by it.</span>}
        {state === 'error' && <span className="text-[13px] text-[var(--danger)]">Could not save. Try again.</span>}
      </div>
    </div>
  );
}
