'use client';

import React, { useState, useEffect, useRef } from 'react';
import { saveBrief } from '@/app/briefs/actions';
import { addAnonBrief } from '@/lib/anon-briefs';
import { BRAND_CATEGORIES, FILM_CATEGORIES, GAMES_CATEGORIES } from '@/lib/brief-patterns';
import SunoPromptModal from './SunoPromptModal';
import BriefDocument, { type Brief } from '@/components/BriefDocument';
import BriefNextSteps from '@/components/BriefNextSteps';
import { btn } from '@/components/ui';
import { buildLoadingMessages } from '@/lib/brief-loading';

// ---------- TYPES ----------

// ---------- DATA ----------
const GENRES = [
  'Cinematic', 'Electronic', 'Hip-Hop', 'Rock', 'Pop', 'Orchestral',
  'Ambient', 'Folk / Acoustic', 'Indie', 'R&B / Soul', 'Alternative',
  'Country', 'Jazz', 'Neo-Classical',
];

// Sync-industry mood vocabulary, tailored per category.
// Sourced from Musicbed / Artlist featured-playlist language.
const CATEGORY_MOODS: Record<string, string[]> = {
  Sports:     ['Triumphant', 'Intense', 'Energetic', 'Powerful', 'Driving', 'Gritty', 'Focused', 'Relentless'],
  Automotive: ['Sleek', 'Driving', 'Powerful', 'Sophisticated', 'Dynamic', 'Bold', 'Epic', 'Majestic'],
  Technology: ['Innovative', 'Clean', 'Futuristic', 'Minimal', 'Sophisticated', 'Inspiring', 'Curious', 'Pulsing'],
  Fashion:    ['Chic', 'Ethereal', 'Sultry', 'Bold', 'Playful', 'Upbeat', 'Intimate', 'Moody'],
  Lifestyle:  ['Chic', 'Ethereal', 'Sultry', 'Bold', 'Playful', 'Upbeat', 'Intimate', 'Moody'],
  Beverage:   ['Vibrant', 'Playful', 'Refreshing', 'Upbeat', 'Warm', 'Nostalgic', 'Quirky', 'Crisp'],
  Food:       ['Vibrant', 'Playful', 'Refreshing', 'Upbeat', 'Warm', 'Nostalgic', 'Quirky', 'Crisp'],
  Healthcare: ['Empathetic', 'Trustworthy', 'Warm', 'Hopeful', 'Grounded', 'Steady', 'Calming', 'Inspiring'],
  Financial:  ['Empathetic', 'Trustworthy', 'Warm', 'Hopeful', 'Grounded', 'Steady', 'Calming', 'Inspiring'],
};

const DEFAULT_MOODS = [
  'Triumphant', 'Melancholic', 'Tense', 'Playful', 'Epic',
  'Intimate', 'Hopeful', 'Mysterious', 'Uplifting', 'Driving', 'Emotional', 'Atmospheric',
];

const FILM_MOODS = [
  'Melancholic', 'Tense', 'Haunting', 'Hopeful', 'Intimate',
  'Eerie', 'Bittersweet', 'Suspenseful', 'Epic', 'Dramatic', 'Serene', 'Nostalgic',
];

const GAMES_MOODS = [
  'Intense', 'Atmospheric', 'Mysterious', 'Adventurous', 'Triumphant',
  'Ominous', 'Focused', 'Playful', 'Epic', 'Tense', 'Serene', 'Heroic',
];

const BRAND_CATEGORY_NAMES = Object.values(BRAND_CATEGORIES).map((c) => c.name);
const FILM_CATEGORY_NAMES = Object.values(FILM_CATEGORIES).map((c) => c.name);
const GAMES_CATEGORY_NAMES = Object.values(GAMES_CATEGORIES).map((c) => c.name);

// ---------- COMPONENTS ----------
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      type="button"
      aria-pressed={active}
      className={`h-10 px-4 text-sm border rounded-[2px] transition-colors ${
        active
          ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)] font-medium'
          : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-dim)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}


function DomainCard({
  active,
  onClick,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-left p-4 md:p-5 border rounded-[2px] transition-colors ${
        active
          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
          : 'border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--border-hover)]'
      }`}
    >
      <span className={`block font-serif text-xl ${active ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>{label}</span>
      <span className="mt-1.5 block text-xs leading-snug text-[var(--text-muted)]">{description}</span>
    </button>
  );
}


function NextSteps({ briefId, loggedIn }: { briefId: string | null; loggedIn: boolean }) {
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 pb-20">
      <BriefNextSteps briefId={briefId} briefName="This brief" variant="practice" loggedIn={loggedIn} />
    </div>
  );
}


// ---------- MAIN APP ----------
export default function BriefGenerator({ user, isAdmin = false, embedded = false }: { user: { email: string; fullName: string } | null; isAdmin?: boolean; embedded?: boolean }) {
  const [category, setCategory] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [domain, setDomain] = useState<'brand' | 'film' | 'games'>('brand');
  const [withVocals, setWithVocals] = useState(false);
  const [generated, setGenerated] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState<string[]>(['Building your custom music brief…']);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedBriefId, setSavedBriefId] = useState<string | null>(null);
  const [announceFeatured, setAnnounceFeatured] = useState(false);
  const briefRef = useRef<HTMLElement>(null);
  const optionsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, loadingMessages.length - 1));
    }, 6500);
    return () => clearInterval(interval);
  }, [loading, loadingMessages.length]);

  const domainMoods =
    domain === 'film' ? FILM_MOODS :
    domain === 'games' ? GAMES_MOODS :
    null;

  const availableMoods = domainMoods
    ? domainMoods
    : (category ? (CATEGORY_MOODS[category] ?? DEFAULT_MOODS) : DEFAULT_MOODS);

  const domainCategories =
    domain === 'film' ? FILM_CATEGORY_NAMES :
    domain === 'games' ? GAMES_CATEGORY_NAMES :
    BRAND_CATEGORY_NAMES;

  const handleDomainChange = (newDomain: 'brand' | 'film' | 'games') => {
    setDomain(newDomain);
    setCategory(null);
    setMoods([]);
  };

  const handleCategorySelect = (c: string) => {
    const newMoods = domainMoods ?? (CATEGORY_MOODS[c] ?? DEFAULT_MOODS);
    setMoods((prev) => prev.filter((m) => newMoods.includes(m)));
    setCategory(c);
  };

  const toggleGenre = (g: string) => {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : prev.length < 3 ? [...prev, g] : prev));
  };

  const toggleMood = (m: string) => {
    setMoods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : prev.length < 3 ? [...prev, m] : prev));
  };

  const canGenerate = !!(category && genres.length > 0 && moods.length > 0);

  const handleGenerate = async () => {
    if (!canGenerate || !category) return;
    setLoadingMessages(
      buildLoadingMessages({
        mode: domain,
        category,
        genres,
        moods,
        withVocals,
      })
    );
    setLoadingStep(0);
    setLoading(true);
    setGenerated(null);

    try {
      // Kick off background generation, then poll for the result.
      const startRes = await fetch('/api/briefs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          genres,
          moods,
          mode: domain,
          withVocals,
        }),
      });

      const startData = await startRes.json();

      if (!startRes.ok || !startData.jobId) {
        console.error('Generation error:', startData.error);
        setLoading(false);
        alert(startData.error ?? 'Could not start generation.');
        return;
      }

      // Poll the status endpoint until the brief is done or errors.
      const jobId = startData.jobId;
      let result: { brief?: Brief; error?: string } = {};

      for (let attempt = 0; attempt < 150; attempt++) {
        await new Promise((r) => setTimeout(r, 3000));
        const statusRes = await fetch(
          `/api/briefs/status?jobId=${jobId}`
        );
        const job = await statusRes.json();

        if (job.status === 'done') {
          result = { brief: job.result };
          break;
        }
        if (job.status === 'error') {
          result = { error: job.error_message ?? 'Generation failed.' };
          break;
        }
        // status still 'pending' — keep polling.
      }

      if (!result.brief && !result.error) {
        result = { error: 'Generation timed out. Please try again.' };
      }

      if (result.error) {
        console.error('Generation error:', result.error);
        setLoading(false);
        alert(result.error);
        return;
      }

      if (result.brief) {
        setGenerated(result.brief);
        setLoading(false);
        setTimeout(() => {
          briefRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        // Auto-save: logged-in users save to their account,
        // logged-out users get stashed locally until they sign up.
        if (user) {
          setSaveStatus('saving');
          setSaveError(null);
          const saveResult = await saveBrief({
            mode: domain,
            target: category,
            genres,
            moods,
            generatedContent: result.brief as unknown as Record<string, unknown>,
            announce: isAdmin && announceFeatured,
          });
          if (saveResult.error) {
            setSaveStatus('error');
            setSaveError(saveResult.error);
          } else {
            setSaveStatus('saved');
            setSavedBriefId(saveResult.briefId ?? null);
          }
        } else {
          addAnonBrief({
            mode: domain,
            target: category,
            genres,
            moods,
            generatedContent: result.brief as unknown as Record<string, unknown>,
          });
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setLoading(false);
      alert('Brief generation failed. Please try again.');
    }
  };

  const handleReset = () => {
    setCategory(null);
    setGenres([]);
    setMoods([]);
    setGenerated(null);
  };

  

  return (
    <div
      className={embedded ? '' : 'min-h-screen'}
      style={{
        color: 'var(--text-primary)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <style>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.6s ease-out forwards; }
        .pulse-soft { animation: pulse-soft 1.4s ease-in-out infinite; }
      `}</style>

      {!embedded && (
        <section className="max-w-3xl mx-auto px-5 md:px-10 pt-14 md:pt-20 pb-4">
          <h1 className="font-serif font-light tracking-tight leading-[1.02] text-[2.75rem] md:text-6xl">The Generator.</h1>
          <p className="mt-4 text-base text-[var(--text-tertiary)] leading-relaxed max-w-xl">
            Practice briefs on demand. Pick a type and a few moods and genres, and it writes a spec the way a supervisor would.
          </p>
        </section>
      )}

      {/* ── Form ── */}
      <section ref={optionsRef} className={`max-w-3xl mx-auto px-5 md:px-10 pb-20 ${embedded ? 'pt-8' : 'pt-10'}`}>

        {/* Domain cards */}
        <div
          className="label text-[var(--text-muted)] mb-4"
          >
          Type
        </div>
        <div className="grid grid-cols-3 gap-3 mb-12">
          <DomainCard
            active={domain === 'brand'}
            onClick={() => handleDomainChange('brand')}
            label="Brand"
            description="Commercials, campaigns, and brand spots."
          />
          <DomainCard
            active={domain === 'film'}
            onClick={() => handleDomainChange('film')}
            label="Film"
            description="Scored cues for film and TV scenes."
          />
          <DomainCard
            active={domain === 'games'}
            onClick={() => handleDomainChange('games')}
            label="Game"
            description="Combat loops, exploration, cutscenes, and title screens."
          />
        </div>

        {/* Category */}
        <div className="mb-10">
          <div
            className="label text-[var(--text-muted)] mb-4"
            >
            {domain === 'film' ? 'Scene Type' : domain === 'games' ? 'Game Context' : 'Category'}
          </div>
          <div className="flex flex-wrap gap-2">
            {domainCategories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => handleCategorySelect(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="mb-10">
          <div
            className="label text-[var(--text-muted)] mb-4"
            >
            Mood <span className="text-[var(--text-dimmer)]">· up to 3</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableMoods.map((m) => (
              <Chip key={m} active={moods.includes(m)} onClick={() => toggleMood(m)}>
                {m}
              </Chip>
            ))}
          </div>
        </div>

        {/* Genre */}
        <div className="mb-10">
          <div
            className="label text-[var(--text-muted)] mb-4"
            >
            Genre <span className="text-[var(--text-dimmer)]">· up to 3</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <Chip key={g} active={genres.includes(g)} onClick={() => toggleGenre(g)}>
                {g}
              </Chip>
            ))}
          </div>
        </div>

        {/* Vocal toggle */}
        <div className="mb-12">
          <div
            className="label text-[var(--text-muted)] mb-4"
            >
            Track
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWithVocals(false)}
              type="button"
              aria-pressed={!withVocals}
              className={`flex-1 h-11 text-sm border rounded-[2px] transition-colors ${
                !withVocals
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                  : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--border-subtle)]'
              }`}
            >
              Instrumental
            </button>
            <button
              onClick={() => setWithVocals(true)}
              type="button"
              aria-pressed={withVocals}
              className={`flex-1 h-11 text-sm border rounded-[2px] transition-colors ${
                withVocals
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                  : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--border-subtle)]'
              }`}
            >
              With vocals
            </button>
          </div>
        </div>

        {/* Generate */}
        <div>
          {isAdmin && (
            <label className="flex items-start gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={announceFeatured}
                onChange={(e) => setAnnounceFeatured(e.target.checked)}
                className="mt-0.5 accent-[#E85D2F]"
              />
              <span className="text-[11px] leading-relaxed text-[var(--text-muted)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Email everyone that this brief is up. Leave unchecked while you iterate.
              </span>
            </label>
          )}
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              className={btn('primary', 'md', 'flex-1 h-12')}
            >
              {loading ? '◆ Generating…' : '◆ Generate brief'}
            </button>
            {(category || genres.length > 0 || moods.length > 0) && !loading && (
              <button type="button" onClick={handleReset} className={btn('ghost', 'sm')}>
                Reset
              </button>
            )}
          </div>
          {!canGenerate && !loading && (
            <p className="text-xs text-[var(--text-dimmer)] text-center">Pick a category, a mood, and a genre to unlock.</p>
          )}
        </div>
      </section>

      {loading && (
        <section className="max-w-2xl mx-auto px-6 py-16 fade-up">
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-4 pulse-soft" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ◆ Working · this takes 30-60 seconds
          </div>
          <div
            key={loadingStep}
            className="text-2xl leading-relaxed text-[var(--text-primary)] fade-up"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
          >
            {loadingMessages[loadingStep]}
          </div>
          <div className="mt-8 flex gap-1.5">
            {loadingMessages.map((_, i) => (
              <div key={i} className={`h-px flex-1 transition-colors duration-300 ${i <= loadingStep ? 'bg-[#E85D2F]' : 'bg-[var(--border-card)]'}`} />
            ))}
          </div>
        </section>
      )}

      {generated && !loading && (
        <>
          <section ref={briefRef} className="max-w-5xl mx-auto px-6 md:px-10 py-16 fade-up overflow-x-hidden">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                ◆ Brief Generated · {generated.briefId}
              </div>
              <div className="flex gap-3 flex-wrap">
                {isAdmin && <SunoPromptModal brief={generated} />}
                <button
                  onClick={handleGenerate}
                  className="text-xs tracking-[0.2em] uppercase px-4 py-2 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
                >
                  ↻ Regenerate
                </button>
                {user && saveStatus !== 'idle' && (
                  <span
                    className={`text-xs tracking-[0.2em] uppercase px-4 py-2 ${
                      saveStatus === 'saved'
                        ? 'text-[#7A9A6E]'
                        : saveStatus === 'error'
                        ? 'text-[#FF8B6B]'
                        : 'text-[var(--text-muted)]'
                    }`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {saveStatus === 'saving' ? '◆ Saving…' :
                     saveStatus === 'saved' ? '✓ Saved' :
                     saveStatus === 'error' ? '× ' + (saveError || 'Could not save') :
                     ''}
                  </span>
                )}
                
              </div>
            </div>
            <BriefDocument brief={generated} />
          </section>
          <NextSteps briefId={savedBriefId} loggedIn={!!user} />
        </>
      )}

    </div>
  );
}