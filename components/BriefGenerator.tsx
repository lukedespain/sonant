'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { saveBrief } from '@/app/briefs/actions';
import { addAnonBrief } from '@/lib/anon-briefs';
import { BRAND_CATEGORIES, FILM_CATEGORIES, GAMES_CATEGORIES } from '@/lib/brief-patterns';
import SunoPromptModal from './SunoPromptModal';
import BriefDocument, { type Brief } from '@/components/BriefDocument';
import SubmitTrackModal from '@/components/SubmitTrackModal';
import UploadTrackModal from '@/components/UploadTrackModal';
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
      className={`transition-all duration-150 px-4 py-2.5 text-sm border tracking-wide ${
        active
          ? 'bg-[#E85D2F]/10 border-[#E85D2F] text-[#E85D2F]'
          : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-dim)] hover:text-[var(--text-primary)]'
      }`}
      style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: active ? 500 : 400, borderRadius: '2px' }}
    >
      {children}
    </button>
  );
}

function BrandIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="13" cy="13" r="9.5" />
    </svg>
  );
}
function FilmIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="8,5 21,13 8,21" />
    </svg>
  );
}
function GamesIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="4" y="4" width="18" height="18" />
    </svg>
  );
}

function DomainCard({
  active,
  onClick,
  icon,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center text-center pt-7 pb-6 px-4 border transition-all duration-200 ${
        active
          ? 'border-[#E85D2F] bg-[#E85D2F]/8'
          : 'border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--border-hover)]'
      }`}
      style={{ borderRadius: '2px' }}
    >
      <div className={`mb-4 transition-colors ${active ? 'text-[#E85D2F]' : 'text-[var(--text-muted)]'}`}>
        {icon}
      </div>
      <div
        className={`text-xl mb-2 transition-colors ${active ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}
        style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}
      >
        {label}
      </div>
      <div
        className={`text-xs leading-snug transition-colors ${active ? 'text-[var(--text-muted)]' : 'text-[var(--text-dimmer)]'}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {description}
      </div>
    </button>
  );
}


function NextSteps({ briefId, loggedIn }: { briefId: string | null; loggedIn: boolean }) {
  const submitHref = loggedIn
    ? (briefId ? `/browse/${briefId}` : '/signup')
    : '/signup';

  return (
    <section className="max-w-5xl mx-auto px-6 md:px-10 py-20">
      <h2 className="text-4xl md:text-5xl mb-3 tracking-tight leading-tight" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
        Once your track is <span className="italic">ready</span>.
      </h2>
      <p className="text-base text-[var(--text-tertiary)] mb-12 max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Upload a take to this brief for free, submit it to the catalog for one credit, or book a session for live notes.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative p-8 border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition-colors flex flex-col" style={{ borderRadius: '2px' }}>
          <div className="flex items-start justify-between mb-6">
            <span className="text-2xl text-[#E85D2F]">↑</span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-dim)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Upload · Playlist
            </span>
          </div>
          <h3 className="text-3xl mb-3 leading-tight text-[var(--text-primary)]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
            Upload to <span className="italic">This Brief</span>
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Attach an MP3 to the playlist. Keep it public so other composers can hear it, or private on your profile.
          </p>
          <ul className="space-y-2 mb-8 flex-1">
            {[
              'Free. No credit used',
              'Public or private, you choose',
              'Lives on this brief and your profile',
              'Does not go to the catalog',
            ].map((b, i) => (
              <li key={i} className="flex gap-3 items-baseline text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="text-[#E85D2F]">·</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            {loggedIn && briefId ? (
              <UploadTrackModal
                briefId={briefId}
                briefName="This brief"
                triggerLabel="↑ Upload MP3"
                triggerClassName="block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase bg-[#F5EFE0] text-[#1A1815] hover:bg-[#FFFFFF] transition-colors text-center"
              />
            ) : (
              <Link
                href={loggedIn ? submitHref : '/signup'}
                className="block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase bg-[#F5EFE0] text-[#1A1815] hover:bg-[#FFFFFF] transition-colors text-center"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
              >
                {loggedIn ? '↗ Open Brief to Upload' : '◆ Create Account to Upload'}
              </Link>
            )}
            <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dim)] text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              MP3 · max 50 MB
            </div>
          </div>
        </div>

        <div className="relative p-8 border border-[#E85D2F]/30 bg-[var(--bg-card)] hover:border-[#E85D2F]/60 transition-colors flex flex-col" style={{ borderRadius: '2px' }}>
          <div className="flex items-start justify-between mb-6">
            <span className="text-2xl text-[#E85D2F]">↗</span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#E85D2F]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Submit · Catalog
            </span>
          </div>
          <h3 className="text-3xl mb-3 leading-tight text-[var(--text-primary)]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
            Submit to the <span className="italic">catalog</span>
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Send your track in for written feedback and catalog consideration. One submission credit. An account is required.
          </p>
          <ul className="space-y-2 mb-8 flex-1">
            {[
              'Uses 1 submission credit',
              'Written feedback on every submission',
              'Accepted tracks are placed and pitched',
              'Non-exclusive: the music stays yours',
            ].map((b, i) => (
              <li key={i} className="flex gap-3 items-baseline text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="text-[#E85D2F]">·</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            {loggedIn && briefId ? (
              <SubmitTrackModal
                briefId={briefId}
                projectName="This brief"
                alreadySubmitted={false}
                triggerLabel="↗ Submit to Catalog"
                triggerClassName="block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors text-center"
              />
            ) : (
              <Link
                href={loggedIn ? submitHref : '/signup'}
                className="block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors text-center"
                style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
              >
                {loggedIn ? '↗ Open Brief to Submit' : '◆ Create Account to Submit'}
              </Link>
            )}
            <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dim)] text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {loggedIn ? '1 credit · written feedback' : 'Free account · 1 credit / month'}
            </div>
          </div>
        </div>

        <div className="relative p-8 border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--border-hover)] transition-colors flex flex-col" style={{ borderRadius: '2px' }}>
          <div className="flex items-start justify-between mb-6">
            <span className="text-2xl text-[#E85D2F]">▷</span>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[var(--text-dim)]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Feedback · Path 02
            </span>
          </div>
          <h3 className="text-3xl mb-3 leading-tight text-[var(--text-primary)]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
            Book a <span className="italic">Feedback Session</span>
          </h3>
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            A 45-minute session with a working sync composer. We listen to your track in full, compare it against the brief, and tell you exactly what it would take to place it.
          </p>
          <ul className="space-y-2 mb-8 flex-1">
            {[
              '45-minute Zoom with recorded notes',
              'Direct comparison against your brief',
              'Honest catalog-readiness assessment',
              'Session recording sent after',
            ].map((b, i) => (
              <li key={i} className="flex gap-3 items-baseline text-sm text-[var(--text-secondary)]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                <span className="text-[#E85D2F]">·</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-3">
            <Link
              href="/sessions"
              className="block w-full px-6 py-3.5 text-sm tracking-[0.15em] uppercase border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[#E85D2F] hover:text-[#E85D2F] transition-colors text-center"
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              ▷ Book a Feedback Session
            </Link>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[var(--text-dim)] text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              $50 · 45 minutes
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          How Sonant works →
        </Link>
      </div>
    </section>
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
  const briefRef = useRef<HTMLElement>(null);
  const optionsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
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

        // Auto-save: logged-in users save to their library,
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

      {/* ── Hero (hidden when embedded on homepage) ── */}
      {!embedded && (
        <section className="max-w-5xl mx-auto px-6 md:px-10 pt-20 pb-10">
          <h1
            className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-3 max-w-2xl"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}
          >
            Generate a brief. <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>Write the music.</span>
          </h1>
          <p
            className="text-sm text-[var(--text-muted)] mb-5"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Build a practice brief to write to. Pick a type, category, mood, and genre. We&apos;ll generate a full creative direction.
          </p>
        </section>
      )}

      {!embedded && <div className="border-t border-[var(--border-base)]" />}

      {/* ── Form ── */}
      <section ref={optionsRef} className={`max-w-2xl mx-auto px-6 pb-20 ${embedded ? 'pt-8' : 'pt-12'}`}>

        {/* Domain cards */}
        <div
          className="text-[9px] tracking-[0.28em] uppercase text-[var(--text-primary)] mb-4"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          Brief Type
        </div>
        <div className="grid grid-cols-3 gap-3 mb-12">
          <DomainCard
            active={domain === 'brand'}
            onClick={() => handleDomainChange('brand')}
            icon={<BrandIcon />}
            label="Brand"
            description="Commercials, campaigns, and brand spots."
          />
          <DomainCard
            active={domain === 'film'}
            onClick={() => handleDomainChange('film')}
            icon={<FilmIcon />}
            label="Film"
            description="Scored cues for film and TV scenes."
          />
          <DomainCard
            active={domain === 'games'}
            onClick={() => handleDomainChange('games')}
            icon={<GamesIcon />}
            label="Game"
            description="Combat loops, exploration, cutscenes, and title screens."
          />
        </div>

        {/* Category */}
        <div className="mb-10">
          <div
            className="text-[9px] tracking-[0.28em] uppercase text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
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
            className="text-[9px] tracking-[0.28em] uppercase text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Mood <span className="opacity-50">· up to 3</span>
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
            className="text-[9px] tracking-[0.28em] uppercase text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Genre <span className="opacity-50">· up to 3</span>
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
            className="text-[9px] tracking-[0.28em] uppercase text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Track Type
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWithVocals(false)}
              className={`flex-1 py-3 text-xs tracking-[0.15em] uppercase transition-all border ${
                !withVocals
                  ? 'border-[#E85D2F] bg-[#E85D2F]/10 text-[#E85D2F]'
                  : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--border-subtle)]'
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              Instrumental
            </button>
            <button
              onClick={() => setWithVocals(true)}
              className={`flex-1 py-3 text-xs tracking-[0.15em] uppercase transition-all border ${
                withVocals
                  ? 'border-[#E85D2F] bg-[#E85D2F]/10 text-[#E85D2F]'
                  : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--border-subtle)]'
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px' }}
            >
              With Vocals
            </button>
          </div>
        </div>

        {/* Generate */}
        <div>
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || loading}
              className={`flex-1 py-4 text-sm tracking-[0.15em] uppercase transition-all ${
                canGenerate && !loading
                  ? 'bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] cursor-pointer'
                  : 'bg-[var(--border-base)] text-[var(--text-dimmer)] cursor-not-allowed'
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
            >
              {loading ? '◆ Generating…' : '◆ Generate Brief'}
            </button>
            {(category || genres.length > 0 || moods.length > 0) && !loading && (
              <button
                onClick={handleReset}
                className="text-xs tracking-[0.2em] uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Reset
              </button>
            )}
          </div>
          {!canGenerate && !loading && (
            <p className="text-[10px] text-[var(--text-dimmer)] text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Pick a category · mood · genre to unlock
            </p>
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
                     saveStatus === 'saved' ? '✓ Saved to library' :
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