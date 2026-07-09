export default function ReviewsPage() {
  return (
    <div className="pt-20 pb-24 flex-1">
      <div className="max-w-5xl mx-auto px-6 md:px-10">

        {/* Hero */}
        <div className="mb-20">
          <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            ◆ Reviews
          </div>
          <h1 className="text-5xl md:text-6xl tracking-tight leading-[1.05] mb-5 max-w-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 300 }}>
            Honest feedback on your <span className="italic text-[#E85D2F]" style={{ fontWeight: 400 }}>work</span>.
          </h1>
          <p className="text-base text-[var(--text-tertiary)] max-w-xl leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            A focused listening session. We walk through your track, identify the gap between brief and music, and name patterns worth tracking. Run by someone who has reviewed thousands of sync and composition tracks.
          </p>
        </div>

        {/* Session card */}
        <div className="max-w-lg mb-20">
          <SessionCard
            duration="15-Minute Session"
            oldPrice="$25"
            body="One track. Focused feedback. Best for sanity-checking a creative choice or a final check before submission."
            cta="Book a 15-min Session"
            bookingUrl="https://cal.com/sonant/15min"
          />
        </div>

        {/* Two-column detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-8" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ◆ Who This Is For
            </div>
            <ul className="space-y-3">
              {[
                'Composers who want craft-level feedback, not just "sounds great."',
                'Composers building portfolios for sync, library, or catalog work.',
                'Composers who have noticed patterns in their own work and want to test them.',
              ].map((text) => (
                <li key={text} className="flex gap-3 items-start">
                  <span className="text-[#E85D2F] text-sm mt-0.5 shrink-0">◆</span>
                  <span className="text-base text-[var(--text-secondary)] leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-[#E85D2F] mb-8" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ◆ What to Bring
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'A finished track',
                'The brief open',
                'One clear question',
                'Direct feedback expected',
              ].map((tag) => (
                <span
                  key={tag}
                  className="text-xs tracking-wide px-3 py-2 border border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                  style={{ fontFamily: "'DM Sans', sans-serif", borderRadius: '2px' }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-6 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Generate a brief first, write to it, then book. Reviews work best when there&apos;s a brief to measure against.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function SessionCard({
  duration,
  oldPrice,
  body,
  cta,
  bookingUrl,
}: {
  duration: string;
  oldPrice: string;
  body: string;
  cta: string;
  bookingUrl: string;
}) {
  return (
    <div className="border border-[var(--border-card)] bg-[var(--bg-card)] p-8 flex flex-col" style={{ borderRadius: '2px' }}>
      <div className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)] mb-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {duration}
      </div>

      <div className="flex items-baseline gap-3 mb-5">
        <span className="text-lg text-[var(--text-dimmer)] line-through" style={{ fontFamily: "'Fraunces', serif" }}>
          {oldPrice}
        </span>
        <span className="text-2xl text-[#E85D2F]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 400 }}>
          Free during Beta
        </span>
      </div>

      <p className="text-sm text-[var(--text-tertiary)] leading-relaxed mb-8 flex-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {body}
      </p>

      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-3 text-xs tracking-[0.15em] uppercase bg-[#E85D2F] text-[var(--bg-base)] hover:bg-[#FF6E3D] transition-colors text-center"
        style={{ fontFamily: "'JetBrains Mono', monospace", borderRadius: '2px', fontWeight: 500 }}
      >
        {cta}
      </a>
    </div>
  );
}
