'use client';

import { useState } from 'react';

type Tags = { genres: string[]; moods: string[] };

function Row({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const all = [...options, ...selected.filter((s) => !options.some((o) => o.toLowerCase() === s.toLowerCase()))];
  const isOn = (tag: string) => selected.some((s) => s.toLowerCase() === tag.toLowerCase());

  function add() {
    const tag = draft.trim();
    if (tag && !isOn(tag)) onChange([...selected, tag]);
    setDraft('');
  }

  return (
    <div>
      <p className="text-[12px] text-[var(--text-muted)] mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5 items-center">
        {all.map((tag) => {
          const on = isOn(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? selected.filter((s) => s.toLowerCase() !== tag.toLowerCase()) : [...selected, tag])}
              className={`h-7 px-2.5 text-[13px] rounded-full border transition-colors ${
                on
                  ? 'bg-[var(--text-primary)] text-[var(--bg-base)] border-[var(--text-primary)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-muted)] line-through decoration-[var(--text-dimmer)] hover:border-[var(--text-primary)]'
              }`}
            >
              {tag}
            </button>
          );
        })}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder="+ add"
          aria-label={`Add a ${label.toLowerCase()} tag`}
          className="h-7 w-24 px-2.5 text-[13px] rounded-full bg-transparent border border-dashed border-[var(--border-subtle)] focus:border-[var(--text-primary)] focus:outline-none"
        />
      </div>
    </div>
  );
}

/** Pick which of the brief's genres and moods a track actually nails. Unticked tags are struck through. */
export default function TagPicker({
  genreOptions,
  moodOptions,
  value,
  onChange,
}: {
  genreOptions: string[];
  moodOptions: string[];
  value: Tags;
  onChange: (next: Tags) => void;
}) {
  return (
    <div className="space-y-3">
      <Row label="Genre" options={genreOptions} selected={value.genres} onChange={(genres) => onChange({ ...value, genres })} />
      <Row label="Mood" options={moodOptions} selected={value.moods} onChange={(moods) => onChange({ ...value, moods })} />
    </div>
  );
}
